import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function POST(req) {
  const body = await req.text();
  const sig = headers().get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("⚠️ Stripe signature verification failed.", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const customerEmail = session.customer_email;

    // Connect to Supabase as admin
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // ✅ Create Supabase user account if not exists
    const { data: existingUser, error: lookupError } =
      await supabase
        .from("users") // your users table if you have one
        .select("*")
        .eq("email", customerEmail)
        .maybeSingle();

    let userId;

    if (!existingUser) {
      // Create a new Supabase user via Admin API
      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email: customerEmail,
          email_confirm: true,
          password: Math.random().toString(36).slice(-12), // random password
        });

      if (createError) {
        console.error("Error creating Supabase user:", createError);
        return NextResponse.json(
          { error: createError.message },
          { status: 500 }
        );
      }

      userId = newUser.user.id;
    } else {
      userId = existingUser.id;
    }

    // ✅ Create a workspace for this user
    const { error: workspaceError } = await supabase
      .from("workspaces")
      .insert({
        user_id: userId,
        name: "New Workspace",
        is_home: true,
      });

    if (workspaceError) {
      console.error("Error creating workspace:", workspaceError);
      return NextResponse.json(
        { error: workspaceError.message },
        { status: 500 }
      );
    }

    console.log(`✅ User and workspace created for ${customerEmail}`);
  }

  return NextResponse.json({ received: true });
}

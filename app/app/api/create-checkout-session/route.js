import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price:"price_1RioIzE3AxMkGgmEzIFNi50w", // replace this!
          quantity: 1,
        },
      ],
      success_url: "https://sterlingopulencefinancial.com/success",
      cancel_url: "https://sterlingopulencefinancial.com/cancel",
    });

    return Response.json({ url: session.url });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}

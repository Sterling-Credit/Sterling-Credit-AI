"use client"

import Link from "next/link"
import { FC } from "react"

interface BrandProps {
  theme?: "dark" | "light"
}

export const Brand: FC<BrandProps> = ({ theme = "dark" }) => {
  return (
    <div className="flex w-full justify-center">
      <div className="text-center text-4xl font-bold tracking-wide">
        Sterling Credit AI
      </div>
    </div>
  )
}

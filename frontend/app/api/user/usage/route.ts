import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ usage: 0, limit: 50, plan: "free" });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { analysesThisMonth: true, plan: true },
    });

    if (!user) {
      return NextResponse.json({ usage: 0, limit: 50, plan: "free" });
    }

    let limit = 50;
    if (user.plan === "pro") limit = 500;
    else if (user.plan === "enterprise") limit = 99999;

    return NextResponse.json({
      usage: user.analysesThisMonth,
      limit,
      plan: user.plan,
    });
  } catch (error) {
    console.error("Usage GET error:", error);
    return NextResponse.json({ error: "Failed to get usage stats" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: true, message: "Guest usage not tracked on server" });
    }

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        analysesThisMonth: {
          increment: 1,
        },
      },
    });

    let limit = 50;
    if (user.plan === "pro") limit = 500;
    else if (user.plan === "enterprise") limit = 99999;

    return NextResponse.json({
      success: true,
      usage: user.analysesThisMonth,
      limit,
      plan: user.plan,
    });
  } catch (error) {
    console.error("Usage POST error:", error);
    return NextResponse.json({ error: "Failed to increment usage stats" }, { status: 500 });
  }
}

import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { auth } from "@/auth"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { id } = await params
    const user = await db.user.delete({
      where: {
        id: id
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("[USER_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

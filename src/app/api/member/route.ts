import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { members, preferences, user } from "@/db/schema";
import { findCity } from "@/lib/cities";
import { getApiUser } from "@/lib/session";
import { getAppState } from "@/lib/server-state";
import { firstIssue, memberSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  try {
    const current = await getApiUser();
    if (!current) return NextResponse.json({ error: "Sign in to save your profile" }, { status: 401 });

    const parsed = memberSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
    }
    const input = parsed.data;

    const city = findCity(input.city);
    if (!city) {
      return NextResponse.json(
        { error: "Choose a city from the supported list so distances stay accurate" },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select()
      .from(members)
      .where(eq(members.id, current.id))
      .limit(1);

    const complete =
      (existing?.onboardingComplete ?? false) ||
      (input.onboardingComplete &&
        input.name.length >= 2 &&
        input.bio.length >= 20 &&
        input.interests.length >= 3);

    const values = {
      id: current.id,
      name: input.name,
      age: input.age,
      gender: input.gender,
      city: city.name,
      area: input.area,
      lat: city.lat,
      lng: city.lng,
      occupation: input.occupation,
      bio: input.bio,
      photo: input.photos[0] ?? "",
      photoAlt: input.photos.length ? `Photo of ${input.name}` : "",
      photos: input.photos,
      interests: input.interests,
      languages: input.languages,
      lookingFor: input.lookingFor,
      promptQuestion: input.promptQuestion,
      promptAnswer: input.promptAnswer,
      idealSunday: input.idealSunday,
      height: input.height,
      education: input.education,
      drinking: input.drinking,
      smoking: input.smoking,
      workout: input.workout,
      anthem: input.anthem,
      showOnline: input.showOnline,
      readReceipts: input.readReceipts,
      notifications: input.notifications,
      onboardingComplete: complete,
      lastActiveAt: new Date(),
      updatedAt: new Date(),
    };

    if (existing) {
      await db.update(members).set(values).where(eq(members.id, current.id));
    } else {
      await db.insert(members).values(values);
    }

    await db
      .insert(preferences)
      .values({
        userId: current.id,
        minAge: Math.max(18, input.age - 6),
        maxAge: Math.min(90, input.age + 8),
        maxDistance: 150,
        lookingFor: "Any intention",
        interests: [],
        verifiedOnly: false,
        updatedAt: new Date(),
      })
      .onConflictDoNothing();

    await db
      .update(user)
      .set({ name: input.name, updatedAt: new Date() })
      .where(eq(user.id, current.id));

    if (!complete) {
      return NextResponse.json(
        { error: "Add a name, a short bio and at least three interests to finish", saved: true },
        { status: 400 },
      );
    }

    return NextResponse.json({ state: await getAppState(current.id) });
  } catch (error) {
    console.error("Profile update failed", error);
    return NextResponse.json({ error: "Could not save profile" }, { status: 500 });
  }
}

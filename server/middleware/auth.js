import { getAuth, clerkClient } from "@clerk/express";
import { sql } from "../config/db.js";

export const protect = async (req, res, next) => {
  try {
    // 1. Get the authenticated Clerk user ID
    const auth = getAuth(req);
    const userId = auth?.userId || req.auth?.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Not authorized, authentication required",
      });
    }

    // 2. Fetch the user profile from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);

    // 3. Get the user's primary email
    const primaryEmail = clerkUser.emailAddresses.find(
      (item) => item.id === clerkUser.primaryEmailAddressId
    );

    const email =
      primaryEmail?.emailAddress ||
      clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      return res.status(400).json({
        error: "No email address found for this Clerk user",
      });
    }

    // 4. Get the user's name and profile image
    const name =
      [clerkUser.firstName, clerkUser.lastName]
        .filter(Boolean)
        .join(" ") ||
      clerkUser.username ||
      email.split("@")[0];

    const image = clerkUser.imageUrl || null;

    // 5. Determine the user's subscription plan
    const userActivePlan = auth.has({ plan: "premium" })
      ? "premium"
      : "free";

    // 6. Check whether this email belongs to another user ID
    const emailConflict = await sql`
      SELECT id
      FROM users
      WHERE LOWER(email) = LOWER(${email})
        AND id <> ${userId}
      LIMIT 1
    `;

    if (emailConflict.length > 0) {
      console.error("Existing email conflict:", {
        clerkUserId: userId,
        existingUserId: emailConflict[0].id,
        email,
      });

      return res.status(409).json({
        error:
          "This email belongs to another database user. Please reconcile the account.",
      });
    }

    // 7. Create the user if missing; update if already present
    await sql`
      INSERT INTO users (
        id,
        name,
        email,
        image,
        plan,
        created_at,
        updated_at
      )
      VALUES (
        ${userId},
        ${name},
        ${email},
        ${image},
        ${userActivePlan},
        NOW(),
        NOW()
      )
      ON CONFLICT (id)
      DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        image = EXCLUDED.image,
        plan = EXCLUDED.plan,
        updated_at = NOW()
    `;

    // 8. Make user details available to controllers
    req.user = {
      id: userId,
      name,
      email,
      image,
      plan: userActivePlan,
    };

    console.log("User synchronized successfully:", {
      userId,
      email,
    });

    // 9. Continue to the controller
    return next();
  } catch (error) {
    console.error("Authentication/user synchronization failed:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Failed to authenticate or synchronize user",
    });
  }
};

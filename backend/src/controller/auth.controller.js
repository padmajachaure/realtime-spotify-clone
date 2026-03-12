import { User } from "../models/user.model.js";

/**
 * POST /api/auth/callback
 * Expected body: { id, firstName, lastName, imageUrl }
 */
export const authCallback = async (req, res, next) => {
  try {
    // log incoming body so we can see what frontend sends
    console.log("Auth callback body:", JSON.stringify(req.body));

    const { id, firstName, lastName, imageUrl } = req.body || {};

    if (!id) {
      console.warn("authCallback: missing clerk id in request body");
      return res.status(400).json({ success: false, message: "Missing id" });
    }

    // See if user exists already
    const user = await User.findOne({ clerkId: id });
    if (user) {
      console.log("authCallback: user already exists:", id);
      return res.status(200).json({ success: true, message: "User already exists" });
    }

    // Fallbacks if frontend didn't send full name or image
    const fullName = `${firstName || ""} ${lastName || ""}`.trim() || "Unknown";
    const avatar = imageUrl || "https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/person.svg";

    // Create user
    const created = await User.create({
      clerkId: id,
      fullName,
      imageUrl: avatar,
    });

    console.log("authCallback: created user:", created._id);
    return res.status(201).json({ success: true, createdId: created._id });
  } catch (error) {
    console.error("Error in auth callback:", error);
    return next(error);
  }
};

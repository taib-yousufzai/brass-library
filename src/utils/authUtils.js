import { getAuth } from "firebase/auth";

/**
 * Force refresh the current user's ID token to get the latest custom claims.
 * This is useful after a role change to ensure the client has the latest role immediately.
 * @returns {Promise<string|null>} The role from the custom claims, or null if not found.
 */
export async function refreshRole() {
    try {
        const auth = getAuth();
        if (!auth.currentUser) return null;

        // Force refresh the token
        await auth.currentUser.getIdToken(true);
        const tokenResult = await auth.currentUser.getIdTokenResult();

        const role = tokenResult.claims.role;
        console.log("Refreshed Role from Claims:", role);
        return role;
    } catch (error) {
        console.error("Error refreshing role:", error);
        return null;
    }
}

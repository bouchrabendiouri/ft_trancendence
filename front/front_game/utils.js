async function getCurrentUser() {
    try {
        const response = await fetch(`${BASE_URL}/user/`, {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("Failed to get current user");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
}
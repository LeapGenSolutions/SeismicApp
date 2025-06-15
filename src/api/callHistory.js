import { BACKEND_URL } from "../constants";

export const insertCallHistory = async (sessionId, reqBody) => {
    const response = await fetch(`${BACKEND_URL}/api/call-history/${sessionId}`,
        {
            method: "POST",
            body: JSON.stringify(reqBody),
            headers: { 'Content-Type': 'application/json' },
        }
    );
    if (!response.ok) {
        console.log("New call History not inserted. Call history and id might exist");
    }
};
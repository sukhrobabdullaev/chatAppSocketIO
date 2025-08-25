// test_api.js
const testSignup = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/v1/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: "Sukhrob Abdullaev",
        email: "sukhrobtech@gmail.com",
        password: "12345678",
      }),
    });

    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Response:", data);
  } catch (error) {
    console.error("Error:", error);
  }
};

testSignup();

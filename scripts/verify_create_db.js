async function testCreateDatabase() {
    const url = "http://localhost:5000/api/create-database";
    const testDbName = "test_created_db_" + Date.now();
    
    console.log("--- Starting Verification Tests ---");

    // Test 1: Incorrect Password
    console.log("\nTest 1: Attempting creation with incorrect password...");
    try {
        const res1 = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dbName: testDbName, password: "wrong_password" })
        });
        const data1 = await res1.json();
        if (res1.status === 401 && !data1.success) {
            console.log("✅ Success: Server rejected incorrect password.");
        } else {
            console.log("❌ Failure: Server did not reject incorrect password as expected.");
        }
    } catch (e) {
        console.log("❌ Error during Test 1:", e.message);
    }

    // Test 2: Correct Password (using default 'admin123' if not set in env)
    console.log("\nTest 2: Attempting creation with correct password...");
    try {
        const res2 = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dbName: testDbName, password: "admin123" })
        });
        const data2 = await res2.json();
        if (res2.ok && data2.success) {
            console.log(`✅ Success: Database '${testDbName}' created.`);
        } else {
            console.log("❌ Failure:", data2.message);
        }
    } catch (e) {
        console.log("❌ Error during Test 2:", e.message);
    }

    console.log("\n--- Verification Tests Complete ---");
}

testCreateDatabase();

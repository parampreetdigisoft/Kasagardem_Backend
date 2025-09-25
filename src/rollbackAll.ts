import migrateMongo from "migrate-mongo";

/**
 * Roll back all applied migrations in reverse order.
 * Does not delete your data; only reverts schema changes.
 */
async function rollbackAll(): Promise<void> {
  const { db, client } = await migrateMongo.database.connect();

  try {
    let appliedMigrations = (await migrateMongo.status(db)).filter(
      (m) => m.appliedAt
    );

    console.error(`Applied migrations: ${appliedMigrations.length}`);

    // Keep rolling back until none are left
    for (const migration of appliedMigrations.reverse()) {
      console.error(`Rolling back: ${migration.fileName}`);
      await migrateMongo.down(db, client); // Only db is required
    }

    console.error("All migrations rolled back successfully.");
  } catch (err) {
    console.error("Error rolling back migrations:", err);
  } finally {
    await client.close();
  }
}

// Run the rollback
rollbackAll().catch((err) => console.error(err));

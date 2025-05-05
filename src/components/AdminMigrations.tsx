import React, { useState } from "react";
import { migrateRestaurantIds } from "../scripts/migrateRestaurantIds";
import { migrateRestaurants } from "../scripts/migrateRestaurants";
import { migrateInitialData, removeDuplicateRestaurants } from "../scripts/migrateData";

const isDev = import.meta.env.MODE === "development";

const migrations = [
  {
    key: "migrateRestaurantIds",
    label: "Migrate Restaurant IDs",
    fn: migrateRestaurantIds,
  },
  {
    key: "migrateRestaurants",
    label: "Migrate Restaurants",
    fn: migrateRestaurants,
  },
  {
    key: "migrateInitialData",
    label: "Migrate Initial Data",
    fn: migrateInitialData,
  },
  {
    key: "removeDuplicateRestaurants",
    label: "Remove Duplicate Restaurants",
    fn: removeDuplicateRestaurants,
  },
];

const AdminMigrations: React.FC = () => {
  const [ran, setRan] = useState<{ [key: string]: boolean }>({});

  if (!isDev) return null;

  const handleRun = async (key: string, fn: () => Promise<void>) => {
    if (!window.confirm("Are you sure you want to run this migration?")) return;
    try {
      await fn();
      setRan((prev) => ({ ...prev, [key]: true }));
      alert(`Migration \"${key}\" ran successfully!`);
      console.log(`Migration \"${key}\" ran successfully!`);
    } catch (err) {
      alert(`Migration \"${key}\" failed. See console for details.`);
      console.error(`Migration \"${key}\" failed:`, err);
    }
  };

  return (
    <div className="p-6 bg-white rounded shadow max-w-md mx-auto my-8">
      <h2 className="text-xl font-bold mb-4">Admin Migrations (Dev Only)</h2>
      <div className="space-y-3">
        {migrations.map(({ key, label, fn }) =>
          ran[key] ? null : (
            <button
              key={key}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
              onClick={() => handleRun(key, fn)}
              disabled={ran[key]}
            >
              {label}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default AdminMigrations; 
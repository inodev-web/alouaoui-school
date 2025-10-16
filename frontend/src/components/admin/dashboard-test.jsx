import { useState, useEffect } from "react";
import dashboardService from "@/services/dashboardService";

const DashboardTest = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const testAPI = async () => {
      try {
        console.log("Testing dashboard API...");
        const result = await dashboardService.getDashboardCards("daily");
        console.log("Dashboard API result:", result);
        setData(result);
      } catch (err) {
        console.error("Dashboard API error:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    testAPI();
  }, []);

  if (loading) return <div>Loading dashboard test...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data received</div>;

  return (
    <div>
      <h2>Dashboard Test</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default DashboardTest;

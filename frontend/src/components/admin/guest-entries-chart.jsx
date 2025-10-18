import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { name: "Jan", entries: 12, cause: "Technical Issues" },
  { name: "Feb", entries: 8, cause: "Payment Problems" },
  { name: "Mar", entries: 15, cause: "System Maintenance" },
  { name: "Apr", entries: 6, cause: "Network Issues" },
  { name: "May", entries: 10, cause: "Server Downtime" },
  { name: "Jun", entries: 4, cause: "Payment Gateway" },
  { name: "Jul", entries: 7, cause: "Technical Issues" },
  { name: "Aug", entries: 9, cause: "System Updates" },
  { name: "Sep", entries: 3, cause: "Maintenance" },
  { name: "Oct", entries: 11, cause: "Network Issues" },
  { name: "Nov", entries: 5, cause: "Server Issues" },
  { name: "Dec", entries: 8, cause: "Payment Problems" },
];

export function GuestEntriesChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Month
                      </span>
                      <span className="font-bold text-muted-foreground">
                        {label}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Entries
                      </span>
                      <span className="font-bold">{payload[0].value}</span>
                    </div>
                    <div className="flex flex-col col-span-2">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Main Cause
                      </span>
                      <span className="font-bold">
                        {payload[0].payload.cause}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Line
          type="monotone"
          dataKey="entries"
          strokeWidth={2}
          stroke="hsl(var(--chart-2))"
          dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

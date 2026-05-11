import React from "react";
import { Paper, Typography, Box, LinearProgress } from "@mui/material";

function StatCard({ data }) {
  const total = data.reduce((acc, item) => acc + item.value, 0);

  return (
    <Paper
      sx={{
        width: "100%",
        height: "100%",
        p: 3,
        borderRadius: 3,
        boxShadow: "none", // نفس ستايل الكاردات عندك
        border: "1px solid",
        borderColor: "divider"
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Total Calls:
        </Typography>

        <Typography variant="h6" fontWeight={700}>
          {total}
        </Typography>
      </Box>

      {/* List */}
      {data.map((item, index) => {
        const percent = total ? (item.value / total) * 100 : 0;

        return (
          <Box key={index} sx={{ mb: 2 }}>
            {/* label + value */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 0.5
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {item.label}
              </Typography>

              <Typography variant="body2" fontWeight={600}>
                {item.value}
              </Typography>
            </Box>

            {/* progress */}
            <LinearProgress
              variant="determinate"
              value={percent}
              color={item.color} // 🔥 هون صار نفس نظام MUI
              sx={{
                height: 8,
                borderRadius: 5,
                "& .MuiLinearProgress-bar": {
                  borderRadius: 5
                }
              }}
            />
          </Box>
        );
      })}
    </Paper>
  );
}

export default StatCard;
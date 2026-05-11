import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableHead, TableRow, Chip, Divider, Avatar, Stack, Button, IconButton,
  Menu, MenuItem, ListItemIcon, ListItemText, TextField, Checkbox
} from "@mui/material";
import { IconEye, IconEdit, IconTrash, IconUsers, IconDots } from '@tabler/icons-react';
import StatCard from './StatCard';
import { useNavigate } from "react-router-dom";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import LowPriorityIcon from "@mui/icons-material/LowPriority";
import useCallsStore from 'hooks/useCallsStore';
import {
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend
} from "chart.js";
import { useState, useMemo, useRef, useEffect  } from "react";
import { Bar } from "react-chartjs-2";
import useAuth from 'hooks/useAuth';
import { useLocation } from "react-router-dom";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const employees = ['Ahmad Ali', 'Sara Mohamed', 'Omar Khaled', 'Lina Hassan', 'Yousef Nasser'];

export default function UploadCall() {
  const navigate = useNavigate();
  const { calls, setCalls } = useCallsStore();

  // Delete
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [callToDelete, setCallToDelete] = useState(null);
  const handleDelete = (id) => {
    setCalls(calls.filter((c) => c.id !== id));
  };

  // 3-dots menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuCallId, setMenuCallId] = useState(null);
  const openMenu = (event, callId) => { setAnchorEl(event.currentTarget); setMenuCallId(callId); };
  const closeMenu = () => { setAnchorEl(null); setMenuCallId(null); };

  // ✅ Users menu — نفس نظام Calls.js
  
  // ✅ استخدم position بدل anchor element
  const [usersMenuPosition, setUsersMenuPosition] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  const closeUsersMenu = () => {
    setUsersMenuPosition(null);
    setUserSearch('');
  };

  
    const filteredEmployees = useMemo(() => {
      return employees.filter((name) =>
        name.toLowerCase().includes(userSearch.toLowerCase())
      );
    }, [userSearch]);


  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const role = (user?.role || '').toLowerCase();
  const isManager = role === 'manager';
    
  const latestCalls = calls.slice(0, 5);

  const sentimentColor = { positive: 'success', negative: 'error', neutral: 'default' };
  const priorityColor = { high: 'error', medium: 'warning', low: 'success' };
  const stateColor = { pending: 'warning', in_progress: 'info', completed: 'success', rejected: 'error' };
  const statusLabel = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed', rejected: 'Rejected' };

  const overviewData = [
    { label: "Neutral Calls", value: 90, color: "secondary" },
    { label: "Positive Calls", value: 20, color: "success" },
    { label: "Negative Calls", value: 45, color: "error" },
    { label: "Follow-up", value: 30, color: "warning" }
  ];

  const sentimentChartData = {
    labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    datasets: [
      { label: "Positive", data: [3, 5, 4, 6, 2, 4, 3], backgroundColor: "#2ecc71", borderRadius: 5, barThickness: 14 },
      { label: "Negative", data: [2, 3, 5, 2, 4, 3, 2], backgroundColor: "#e74c3c", borderRadius: 5, barThickness: 14 }
    ]
  };

  const topIssues = [
    { issue: "Billing Problem", percent: 45 },
    { issue: "Technical Issue", percent: 35 },
    { issue: "Account Access", percent: 25 },
    { issue: "Other", percent: 10 }
  ];

  const keywords = ["refund", "delay", "password", "cancel", "support", "error"];
const location = useLocation();
const state = location.state;

useEffect(() => {
   

    // ✅ فتح users menu بمنتصف يمين الشاشة لما يجي من Dashboard
    if (state?.openUsers) {
      setTimeout(() => {
        setUsersMenuPosition({
          top: window.innerHeight / 2,
          left: window.innerWidth / 2
        });
      }, 300);
    }

    window.history.replaceState({}, document.title);
  }, []);

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }}>

      {/* Priority Cards */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", '@media (max-width: 900px)': { flexDirection: "column" } }}>
        <Card sx={{ flex: 1, minWidth: 0 }}>
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "error.light", width: 48, height: 48 }}><PriorityHighIcon color="error" /></Avatar>
            <Box><Typography variant="subtitle2" color="text.secondary">High Priority</Typography><Typography variant="h4" sx={{ fontWeight: 700 }}>45</Typography></Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 0 }}>
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "warning.light", width: 48, height: 48 }}><ReportProblemIcon color="warning" /></Avatar>
            <Box><Typography variant="subtitle2" color="text.secondary">Medium Priority</Typography><Typography variant="h4" sx={{ fontWeight: 700 }}>70</Typography></Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 0 }}>
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "success.light", width: 48, height: 48 }}><LowPriorityIcon color="success" /></Avatar>
            <Box><Typography variant="subtitle2" color="text.secondary">Low Priority</Typography><Typography variant="h4" sx={{ fontWeight: 700 }}>120</Typography></Box>
          </CardContent>
        </Card>
      </Box>

      {/* Overview + Sentiment */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", '@media (max-width: 900px)': { flexDirection: "column" } }}>
        <Card sx={{ flex: 1, minWidth: 0 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Overview</Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", justifyContent: "center" }}><StatCard data={overviewData} /></Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 0 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Sentiment</Typography>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ height: 220, mt: 1 }}><Bar data={sentimentChartData} options={{ responsive: true, maintainAspectRatio: false }} /></Box>
          </CardContent>
        </Card>
      </Box>

      {/* Table */}
      <Card sx={{ width: "100%" }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Latest Calls</Typography>
          <Divider sx={{ mb: 2 }} />
          <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell sx={{ width: 120 }}>Priority</TableCell>
                <TableCell sx={{ width: 140 }}>Status</TableCell>
                <TableCell sx={{ width: 120 }}>Sentiment</TableCell>
                <TableCell sx={{ width: 100 }}>Duration</TableCell>
                <TableCell sx={{ width: 140 }}>Created At</TableCell>
                <TableCell sx={{ width: 120 }}>Reviewed</TableCell>
                <TableCell sx={{ width: 150 }}>Uploaded By</TableCell>
                <TableCell align="center" sx={{ width: 160 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {latestCalls.map((call) => (
                <TableRow key={call.id} sx={{ '& td': { py: 1.5 } }}>
                  <TableCell sx={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {call.id.length > 14 ? call.id.slice(0, 14) + '...' : call.id}
                  </TableCell>
                  <TableCell><Chip label={call.priority} color={priorityColor[call.priority]} size="small" /></TableCell>
                  <TableCell><Chip label={statusLabel[call.status] || call.status} color={stateColor[call.status]} size="small" /></TableCell>
                  <TableCell><Chip label={call.sentiment} color={sentimentColor[call.sentiment]} size="small" /></TableCell>
                  <TableCell>{call.duration}</TableCell>
                  <TableCell>
                    <Box component="span" sx={{ unicodeBidi: 'isolate', display: 'inline-block' }}>{call.createdAt}</Box>
                  </TableCell>
                  <TableCell><Chip label={call.reviewed} color={call.reviewed === 'Yes' ? 'success' : 'error'} size="small" /></TableCell>
                  <TableCell>{call.uploadedBy}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton size="small" onClick={() => navigate("/calls", { state: { selectedCallId: call.id } })} sx={{ color: '#673ab7' }}>
                        <IconEye size={18} />
                      </IconButton>
                      <IconButton size="small" onClick={(e) => openMenu(e, call.id)} sx={{ color: '#1e88e5' }}>
                        <IconDots size={18} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 3-dots Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        <MenuItem onClick={() => {
          navigate("/calls", { state: { selectedCallId: menuCallId, mode: "edit" } });
          closeMenu();
        }}>
          <ListItemIcon><IconEdit size={16} /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>

        {/* ✅ Users — يفتح مباشرة بالداش بجنب الزر */}
        <MenuItem onClick={(e) => {
          const rect = anchorEl.getBoundingClientRect();
          setUsersMenuPosition({ top: rect.top, left: rect.left });
          closeMenu();
        }}>
          <ListItemIcon><IconUsers size={16} /></ListItemIcon>
          <ListItemText>Users</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => {
          setCallToDelete(menuCallId);
          setOpenDeleteDialog(true);
          closeMenu();
        }}>
          <ListItemIcon><IconTrash size={16} /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* ✅ Users Menu — نفس نظام Calls.js */}
      <Menu
        open={Boolean(usersMenuPosition)}
        onClose={closeUsersMenu}
        anchorReference="anchorPosition"
        anchorPosition={usersMenuPosition ?? undefined}
        disableAutoFocusItem
        disableEnforceFocus
        PaperProps={{ sx: { width: 280, p: 1 } }}
      >
        <Box sx={{ px: 1, py: 1 }}>
          <TextField
            onKeyDown={(e) => e.stopPropagation()}
            size="small" fullWidth placeholder="Search employees..."
            value={userSearch} autoFocus
            onChange={(e) => setUserSearch(e.target.value)}
          />
        </Box>
        <Divider />
        {filteredEmployees.map((name) => (
          <MenuItem key={name} onClick={() => {
            setSelectedUsers((prev) =>
              prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
            );
          }}>
            <Checkbox checked={selectedUsers.includes(name)} />
            <ListItemText>{name}</ListItemText>
          </MenuItem>
        ))}
        <Divider />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
          <Button variant="contained" size="small" onClick={() => {
            console.log('Selected Users:', selectedUsers);
             setSelectedUsers([]);
            closeUsersMenu();
          }}>
            send
          </Button>
        </Box>
      </Menu>
      {/* Delete Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}
        maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete {callToDelete}?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} variant="outlined"
            sx={{ color: 'text.secondary', borderColor: 'grey.400', '&:hover': { borderColor: 'grey.600', backgroundColor: 'grey.100' } }}>
            Cancel
          </Button>
          <Button onClick={() => { handleDelete(callToDelete); setOpenDeleteDialog(false); }}
            variant="contained" color="error"
            sx={{ backgroundColor: 'error.dark', '&:hover': { backgroundColor: 'error.main' } }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Top Issues + Keywords */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", '@media (max-width: 900px)': { flexDirection: "column" } }}>
        <Card sx={{ flex: 1, minWidth: 0, borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Top Issues</Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              {topIssues.map((issue) => (
                <Box key={issue.issue} sx={{ p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider", position: "relative", overflow: "hidden", zIndex: 1 }}>
                  <Box sx={{
                    position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%",
                    background: issue.percent > 40 ? "#FCE7F3" : issue.percent > 30 ? "#F3E8FF" : issue.percent > 20 ? "#FEF9C3" : "#D1D5DB",
                    transform: "translate(40%, -40%)", filter: "blur(2px)", pointerEvents: "none", zIndex: 0
                  }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, position: "relative", zIndex: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography sx={{ fontWeight: 600 }}>{issue.issue}</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", px: 1, py: 0.3, borderRadius: 1 }}>{issue.percent}%</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mt: 2, height: 6, borderRadius: 5, backgroundColor: "action.hover", overflow: "hidden", position: "relative", zIndex: 2 }}>
                    <Box sx={{
                      width: `${issue.percent}%`, height: "100%", borderRadius: 5,
                      background: issue.percent > 40 ? "#EC4899" : issue.percent > 30 ? "#A855F7" : issue.percent > 20 ? "#FDE047" : "#6B7280"
                    }} />
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 0 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Keywords</Typography>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
              {keywords.map((word) => <Chip key={word} label={word} variant="outlined" />)}
            </Box>
          </CardContent>
        </Card>
      </Box>

    </Box>
  );
}
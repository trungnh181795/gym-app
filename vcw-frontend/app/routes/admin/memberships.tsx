import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Avatar,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Skeleton,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CardMembership as MembershipIcon,
  QrCode as QRIcon,
} from "@mui/icons-material";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Benefit {
  id: string;
  name: string;
  description: string;
  price: number;
  isShareable?: boolean;
}

interface Membership {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: "active" | "suspended" | "expired" | "cancelled";
  validFrom: string;
  validUntil: string;
  benefitIds: string[];
  user?: User;
  benefits?: Benefit[];
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  active: "success",
  suspended: "warning",
  expired: "error",
  cancelled: "default",
} as const;

export default function AdminMemberships() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingBenefits, setLoadingBenefits] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [credentialToken, setCredentialToken] = useState<string>("");
  const [qrTimer, setQrTimer] = useState(60);
  const [editingMembership, setEditingMembership] = useState<Membership | null>(
    null
  );
  const [formData, setFormData] = useState({
    userId: "",
    name: "",
    description: "",
    status: "active" as Membership["status"],
    validFrom: "",
    validUntil: "",
    benefits: [] as Array<{
      benefitId: string;
      isShared: boolean;
      sharedWithUserId?: string;
    }>,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  useEffect(() => {
    fetchMemberships();
    fetchUsers();
    fetchBenefits();
  }, []);

  // QR Code timer countdown
  useEffect(() => {
    if (qrDialogOpen && qrTimer > 0) {
      const timer = setTimeout(() => setQrTimer(qrTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (qrTimer === 0) {
      setQrDialogOpen(false);
      setQrTimer(60);
    }
  }, [qrDialogOpen, qrTimer]);

  const fetchMemberships = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/memberships/with-details");
      const data = await response.json();
      setMemberships(data.data || []);
    } catch (error) {
      console.error("Error fetching memberships:", error);
      setSnackbar({
        open: true,
        message: "Failed to fetch memberships",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch("/api/users");
      const data = await response.json();
      setUsers(data.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchBenefits = async () => {
    try {
      setLoadingBenefits(true);
      const response = await fetch("/api/benefits");
      const data = await response.json();
      setBenefits(data.data || []);
    } catch (error) {
      console.error("Error fetching benefits:", error);
    } finally {
      setLoadingBenefits(false);
    }
  };

  const handleOpenDialog = (membership?: Membership) => {
    if (membership) {
      setEditingMembership(membership);
      // Convert benefitIds to benefits array structure
      const benefitsArray = membership.benefitIds.map((id) => ({
        benefitId: id,
        isShared: false,
        sharedWithUserId: undefined,
      }));
      setFormData({
        userId: membership.userId,
        name: membership.name,
        description: membership.description,
        status: membership.status,
        validFrom: membership.validFrom.split("T")[0],
        validUntil: membership.validUntil.split("T")[0],
        benefits: benefitsArray,
      });
    } else {
      setEditingMembership(null);
      const today = new Date().toISOString().split("T")[0];
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);

      setFormData({
        userId: "",
        name: "",
        description: "",
        status: "active",
        validFrom: today,
        validUntil: nextYear.toISOString().split("T")[0],
        benefits: [],
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMembership(null);
  };

  const handleSave = async () => {
    try {
      const membershipData = {
        userId: formData.userId,
        name: formData.name,
        description: formData.description,
        status: formData.status,
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(formData.validUntil).toISOString(),
        benefits: formData.benefits.map((b) => {
          const benefit = benefits.find((ben) => ben.id === b.benefitId);
          return {
            type: "membership" as const,
            name: benefit?.name || "",
            description: benefit?.description || "",
            price: benefit?.price || 0,
            isShared: b.isShared,
            sharedWithUserId: b.isShared ? b.sharedWithUserId : undefined,
          };
        }),
      };

      const url = editingMembership
        ? `/api/memberships/${editingMembership.id}`
        : "/api/memberships";
      const method = editingMembership ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(membershipData),
      });

      if (response.ok) {
        const result = await response.json();

        // Store credential token and show QR code for new memberships
        if (!editingMembership && result.data?.credentialToken) {
          setCredentialToken(result.data.credentialToken);
          setQrTimer(60); // Reset timer
          setQrDialogOpen(true);
        }

        setSnackbar({
          open: true,
          message: `Membership ${editingMembership ? "updated" : "created"} successfully`,
          severity: "success",
        });
        handleCloseDialog();
        fetchMemberships();
      } else {
        throw new Error("Failed to save membership");
      }
    } catch (error) {
      console.error("Error saving membership:", error);
      setSnackbar({
        open: true,
        message: "Failed to save membership",
        severity: "error",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this membership?")) return;

    try {
      const response = await fetch(`/api/memberships/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setSnackbar({
          open: true,
          message: "Membership deleted successfully",
          severity: "success",
        });
        fetchMemberships();
      } else {
        throw new Error("Failed to delete membership");
      }
    } catch (error) {
      console.error("Error deleting membership:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete membership",
        severity: "error",
      });
    }
  };

  const generateQR = async (membershipId: string) => {
    try {
      const response = await fetch(`/api/memberships/${membershipId}/qr-admin`);
      const data = await response.json();

      if (response.ok) {
        // Open QR code in new window or show in dialog
        alert("QR code generated successfully!");
      } else {
        throw new Error("Failed to generate QR code");
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
      setSnackbar({
        open: true,
        message: "Failed to generate QR code",
        severity: "error",
      });
    }
  };

  const getBenefitNames = (benefitIds: string[]) => {
    return benefitIds
      .map((id) => benefits.find((b) => b.id === id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  const getUserName = (userId: string) => {
    return users.find((u) => u.id === userId)?.name || "Unknown User";
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          Memberships Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Membership
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Member</TableCell>
              <TableCell>Membership</TableCell>
              <TableCell>Benefits</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Valid Period</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              // Skeleton loading rows
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Skeleton variant="circular" width={40} height={40} />
                      <Skeleton variant="text" width={120} height={20} />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Skeleton variant="text" width="70%" height={20} />
                      <Skeleton variant="text" width="90%" height={16} />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width="80%" height={20} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="rounded" width={70} height={24} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width={140} height={20} />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Skeleton variant="circular" width={32} height={32} />
                      <Skeleton variant="circular" width={32} height={32} />
                      <Skeleton variant="circular" width={32} height={32} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : memberships.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No memberships found. Click "Add Membership" to create your
                    first membership.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              memberships.map((membership) => (
                <TableRow key={membership.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: "primary.main" }}>
                        {getUserName(membership.userId).charAt(0)}
                      </Avatar>
                      <Typography variant="body2">
                        {getUserName(membership.userId)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {membership.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {membership.description}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getBenefitNames(membership.benefitIds) || "No benefits"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={membership.status}
                      color={statusColors[membership.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(membership.validFrom).toLocaleDateString()} -{" "}
                      {new Date(membership.validUntil).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => generateQR(membership.id)}
                      size="small"
                      color="primary"
                    >
                      <QRIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleOpenDialog(membership)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(membership.id)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingMembership ? "Edit Membership" : "Add New Membership"}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <FormControl fullWidth>
              <InputLabel>Member</InputLabel>
              <Select
                value={formData.userId}
                onChange={(e) =>
                  setFormData({ ...formData, userId: e.target.value })
                }
                label="Member"
                required
                disabled={loadingUsers}
              >
                {loadingUsers ? (
                  <MenuItem disabled>
                    <Skeleton variant="text" width="100%" height={20} />
                  </MenuItem>
                ) : users.length === 0 ? (
                  <MenuItem disabled>No users available</MenuItem>
                ) : (
                  users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name} - {user.email}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <TextField
              label="Membership Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              fullWidth
              required
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              fullWidth
              multiline
              rows={3}
              required
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Benefits
              </Typography>
              {loadingBenefits ? (
                <Skeleton variant="rectangular" height={100} />
              ) : benefits.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No benefits available
                </Typography>
              ) : (
                benefits.map((benefit) => {
                  const selectedBenefit = formData.benefits.find(
                    (b) => b.benefitId === benefit.id
                  );
                  const isSelected = !!selectedBenefit;

                  return (
                    <Box
                      key={benefit.id}
                      sx={{
                        mb: 2,
                        p: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <Checkbox
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                benefits: [
                                  ...formData.benefits,
                                  {
                                    benefitId: benefit.id,
                                    isShared: false,
                                    sharedWithUserId: undefined,
                                  },
                                ],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                benefits: formData.benefits.filter(
                                  (b) => b.benefitId !== benefit.id
                                ),
                              });
                            }
                          }}
                        />
                        <Box flexGrow={1}>
                          <Typography variant="body1">
                            {benefit.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            $
                            {benefit.price !== undefined &&
                            benefit.price !== null
                              ? benefit.price
                              : "0"}
                          </Typography>
                        </Box>
                      </Box>

                      {benefit.isShareable && isSelected && (
                        <Box sx={{ ml: 5, mt: 1 }}>
                          <>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={selectedBenefit.isShared}
                                  onChange={(e) => {
                                    setFormData({
                                      ...formData,
                                      benefits: formData.benefits.map((b) =>
                                        b.benefitId === benefit.id
                                          ? {
                                              ...b,
                                              isShared: e.target.checked,
                                              sharedWithUserId: e.target.checked
                                                ? b.sharedWithUserId
                                                : undefined,
                                            }
                                          : b
                                      ),
                                    });
                                  }}
                                />
                              }
                              label="Share with another member"
                            />

                            {selectedBenefit.isShared && (
                              <FormControl fullWidth sx={{ mt: 1 }}>
                                <InputLabel>Share with user</InputLabel>
                                <Select
                                  value={selectedBenefit.sharedWithUserId || ""}
                                  onChange={(e) => {
                                    setFormData({
                                      ...formData,
                                      benefits: formData.benefits.map((b) =>
                                        b.benefitId === benefit.id
                                          ? {
                                              ...b,
                                              sharedWithUserId: e.target.value,
                                            }
                                          : b
                                      ),
                                    });
                                  }}
                                  label="Share with user"
                                >
                                  {users
                                    .filter((u) => u.id !== formData.userId)
                                    .map((user) => (
                                      <MenuItem key={user.id} value={user.id}>
                                        {user.name} - {user.email}
                                      </MenuItem>
                                    ))}
                                </Select>
                              </FormControl>
                            )}
                          </>
                        </Box>
                      )}
                    </Box>
                  );
                })
              )}
            </Box>

            <Box display="flex" gap={2}>
              <TextField
                label="Valid From"
                type="date"
                value={formData.validFrom}
                onChange={(e) =>
                  setFormData({ ...formData, validFrom: e.target.value })
                }
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Valid Until"
                type="date"
                value={formData.validUntil}
                onChange={(e) =>
                  setFormData({ ...formData, validUntil: e.target.value })
                }
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as Membership["status"],
                  })
                }
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingMembership ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog
        open={qrDialogOpen}
        onClose={() => {
          setQrDialogOpen(false);
          setQrTimer(60);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">
              Membership Credentials Generated
            </Typography>
            <Chip
              label={`${qrTimer}s remaining`}
              color={qrTimer < 20 ? "error" : "primary"}
              size="small"
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Important: Share this QR code with the member!
            </Typography>
            <Typography variant="body2">
              This QR code will disappear in {qrTimer} seconds. The member
              should save a screenshot for check-in verification.
            </Typography>
          </Alert>

          {credentialToken && (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              gap={3}
            >
              <Paper elevation={3} sx={{ p: 3, bgcolor: "white" }}>
                <QRCode value={credentialToken} size={300} level="L" />
              </Paper>

              <Box textAlign="center">
                <Typography variant="subtitle2" gutterBottom>
                  Credential Token
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontFamily: "monospace", wordBreak: "break-all" }}
                >
                  {credentialToken}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setQrDialogOpen(false);
              setQrTimer(60);
            }}
            variant="contained"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

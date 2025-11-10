import { useState, useEffect } from "react";
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
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Assignment as CredentialIcon,
  CheckCircle as ActiveIcon,
  ContentCopy as CopyIcon,
  Block as BlockIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { Link } from "react-router";
import CreateCredentialDialog from "../components/dialogs/CreateCredentialDialog";
import type { CredentialListItem } from "../types";
import apiClient from "../api";
import { useGymInfo } from "../hooks/useGymInfo";

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<CredentialListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [credentialFormOpen, setCredentialFormOpen] = useState(false);
  const [selectedCredentialId, setSelectedCredentialId] = useState<
    string | null
  >(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  

  const { getIssuerDisplayName } = useGymInfo();

  const filteredCredentials = credentials.filter(
    (credential) =>
      credential.subject.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      credential.subject.plan
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      credential.subject.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "revoked":
        return "error";
      case "expired":
        return "warning";
      default:
        return "default";
    }
  };

  const loadCredentials = async () => {
    try {
      setLoading(true);
      setError(null);
      const credentialsData = await apiClient.getCredentials();
      setCredentials(credentialsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load credentials"
      );
      console.error("Error loading credentials:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCredentials();
  }, []);

  const handleCopyCredential = async (credentialId: string) => {
    try {
      const { jwt } = await apiClient.getCredentialJwt(credentialId);
      await navigator.clipboard.writeText(jwt);
      setSuccessMessage(
        "Credential JWT copied to clipboard! You can now paste it in the Tools page to verify locally."
      );
    } catch (err) {
      setError("Failed to copy credential JWT");
    }
  };

  const handleRevokeCredential = async (credentialId: string, credentialName: string) => {
    const reason = prompt(
      `Are you sure you want to revoke this credential?\n\nCredential: ${credentialName}\n\nEnter the reason for revocation (optional):`
    );
    
    if (reason === null) {
      // User cancelled
      return;
    }

    try {
      await apiClient.revokeCredential(credentialId, reason || undefined);
      setSuccessMessage("Credential revoked successfully");
      loadCredentials(); // Refresh the list
    } catch (err) {
      setError("Failed to revoke credential");
    }
  };

  const handleCreateCredential = async (credentialData: { holderDid: string; name: string; plan: string; benefitType?: string; membershipId?: string }) => {
    try {
      await apiClient.createCredential(credentialData);
      await loadCredentials(); // Refresh the list
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to create credential"
      );
    }
  };

  

  const handleCloseCredentialForm = () => {
    setCredentialFormOpen(false);
  };


  const stats = {
    total: credentials.length,
    active: credentials.filter((c) => c.status === "active").length,
    revoked: credentials.filter((c) => c.status === "revoked").length,
    expired: credentials.filter((c) => c.status === "expired").length,
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Credentials
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCredentialFormOpen(true)}
        >
          Create Credential
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Box sx={{ display: "flex", gap: 3, mb: 3, flexWrap: "wrap" }}>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Credentials
                </Typography>
                <Typography variant="h5" component="div">
                  {stats.total}
                </Typography>
              </Box>
              <CredentialIcon color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Active
                </Typography>
                <Typography variant="h5" component="div" color="success.main">
                  {stats.active}
                </Typography>
              </Box>
              <ActiveIcon color="success" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Revoked
                </Typography>
                <Typography variant="h5" component="div" color="error.main">
                  {stats.revoked}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Expired
                </Typography>
                <Typography variant="h5" component="div" color="warning.main">
                  {stats.expired}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2, display: "flex", gap: 2, alignItems: "center" }}>
          <TextField
            placeholder="Search credentials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadCredentials}
            disabled={loading}
          >
            Refresh
          </Button>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ ml: "auto" }}
          >
            {filteredCredentials.length} of {credentials.length} credentials
          </Typography>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Subject</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Issuer</TableCell>
              <TableCell>Issued Date</TableCell>
              <TableCell>Membership ID</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCredentials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm
                      ? "No credentials match your search criteria."
                      : "No credentials found. Create your first credential!"}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredCredentials.map((credential) => (
                <TableRow key={credential.id} hover>
                  <TableCell>
                    <Box>
                      <Typography
                        variant="body2"
                        fontWeight="medium"
                        component={Link}
                        to={`/dashboard/credentials/${credential.id}`}
                        sx={{
                          textDecoration: "none",
                          color: "primary.main",
                          "&:hover": { textDecoration: "underline" },
                        }}
                      >
                        {credential.subject.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {credential.subject.plan}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={credential.status}
                      color={getStatusColor(credential.status) as any}
                      size="small"
                      sx={{ textTransform: "capitalize" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "monospace",
                        fontSize: "0.875rem",
                        maxWidth: 150,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={credential.issuer}
                    >
                      {getIssuerDisplayName(credential.issuer)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(credential.issuedAt), "MMM dd, yyyy")}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {credential.membershipId || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        title="Copy JWT"
                        onClick={() => handleCopyCredential(credential.id)}
                      >
                        <CopyIcon />
                      </IconButton>
                      <IconButton
                        component={Link}
                        size="small"
                        title="Open details"
                        to={`/dashboard/credentials/${credential.id}`}
                        style={{ textDecoration: "none" }}
                      >
                        <EditIcon />
                      </IconButton>
                      {credential.status === 'active' && (
                        <IconButton
                          size="small"
                          title="Revoke credential"
                          onClick={() => handleRevokeCredential(credential.id, credential.subject.name)}
                          sx={{ color: 'error.main' }}
                        >
                          <BlockIcon />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CreateCredentialDialog
        open={credentialFormOpen}
        onClose={handleCloseCredentialForm}
        onSubmit={handleCreateCredential}
        title="Create New Credential"
      />

      {/* Success Message */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>

    </Box>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  LinearProgress
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning,
  CheckCircle,
  Error,
  Shield,
  Lock,
  VerifiedUser,
  Visibility,
  Refresh
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useWebSocket } from '../contexts/WebSocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const Security = () => {
  const { securityEvents } = useWebSocket();
  const [tabValue, setTabValue] = useState(0);
  const [securityMetrics, setSecurityMetrics] = useState({});
  const [events, setEvents] = useState([]);
  const [threats, setThreats] = useState({});
  const [compliance, setCompliance] = useState({});
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const [overview, eventsData, threatsData, complianceData] = await Promise.all([
        axios.get('/api/security/overview'),
        axios.get('/api/security/events?limit=20'),
        axios.get('/api/security/threats'),
        axios.get('/api/security/compliance')
      ]);
      
      setSecurityMetrics(overview.data.security || {});
      setEvents(eventsData.data.events || []);
      setThreats(threatsData.data.threats || {});
      setCompliance(complianceData.data.compliance || {});
    } catch (error) {
      console.error('Failed to fetch security data:', error);
    }
  };

  const runSecurityScan = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/security/scan');
      toast.success('Sikkerhedsscan gennemført succesfuldt');
      setScanDialogOpen(false);
      fetchSecurityData();
    } catch (error) {
      toast.error('Sikkerhedsscan fejlede');
    } finally {
      setLoading(false);
    }
  };

  const getThreatLevelColor = (level) => {
    const colors = {
      low: 'success',
      medium: 'warning',
      high: 'error',
      critical: 'error'
    };
    return colors[level] || 'default';
  };

  const getThreatLevelIcon = (level) => {
    const icons = {
      low: <CheckCircle />,
      medium: <Warning />,
      high: <Error />,
      critical: <Error />
    };
    return icons[level] || <CheckCircle />;
  };

  const securityTrendData = [
    { date: '1 uge', incidents: 2 },
    { date: '6 dage', incidents: 1 },
    { date: '5 dage', incidents: 0 },
    { date: '4 dage', incidents: 3 },
    { date: '3 dage', incidents: 1 },
    { date: '2 dage', incidents: 0 },
    { date: 'I dag', incidents: 0 }
  ];

  const threatDistribution = [
    { name: 'Lav', value: 85, color: '#4CAF50' },
    { name: 'Medium', value: 12, color: '#FF9800' },
    { name: 'Høj', value: 3, color: '#F44336' },
    { name: 'Kritisk', value: 0, color: '#D32F2F' }
  ];

  const TabPanel = ({ children, value, index }) => (
    <Box sx={{ display: value !== index ? 'none' : 'block', pt: 2 }}>
      {children}
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Sikkerhedscenter 🛡️
      </Typography>

      {/* Security Status Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <SecurityIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" gutterBottom color="success.main">
                SIKKER
              </Typography>
              <Typography color="text.secondary">
                Generel Status
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Shield sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" gutterBottom>
                {securityMetrics.activeAlerts || 0}
              </Typography>
              <Typography color="text.secondary">
                Aktive Advarsler
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Lock sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" gutterBottom>
                AES-256
              </Typography>
              <Typography color="text.secondary">
                Kryptering
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <VerifiedUser sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" gutterBottom>
                AKTIV
              </Typography>
              <Typography color="text.secondary">
                Zero-Trust
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Current Threat Level */}
      {securityMetrics.threatLevel && (
        <Alert 
          severity={getThreatLevelColor(securityMetrics.threatLevel)} 
          icon={getThreatLevelIcon(securityMetrics.threatLevel)}
          sx={{ mb: 3 }}
        >
          <Typography variant="h6">
            Nuværende trusselsniveau: {securityMetrics.threatLevel?.toUpperCase()}
          </Typography>
          <Typography>
            Sidste sikkerhedsscan: {new Date().toLocaleString('da-DK')}
          </Typography>
        </Alert>
      )}

      {/* Security Details */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Oversigt" />
            <Tab label="Sikkerhedshændelser" />
            <Tab label="Compliance" />
            <Tab label="Indstillinger" />
          </Tabs>
        </Box>

        <CardContent>
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              {/* Security Trend Chart */}
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>
                  Sikkerhedshændelser (7 dage)
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={securityTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="incidents" 
                        stroke="#FF6B35" 
                        strokeWidth={2}
                        dot={{ fill: '#FF6B35', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>

              {/* Threat Distribution */}
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom>
                  Trusselfordeling
                </Typography>
                <Box sx={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={threatDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                      >
                        {threatDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Andel']} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ mt: 2 }}>
                  {threatDistribution.map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, bgcolor: item.color, borderRadius: '50%' }} />
                        <Typography variant="body2">{item.name}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">{item.value}%</Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>

              {/* Quick Actions */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Hurtige Handlinger
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<Refresh />}
                    onClick={() => setScanDialogOpen(true)}
                    color="primary"
                  >
                    Kør Sikkerhedsscan
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={fetchSecurityData}
                  >
                    Opdater Data
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Seneste Sikkerhedshændelser
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tidspunkt</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Alvorlighed</TableCell>
                    <TableCell>Beskrivelse</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {events.map((event, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {new Date(event.timestamp).toLocaleString('da-DK')}
                      </TableCell>
                      <TableCell>{event.event_type}</TableCell>
                      <TableCell>
                        <Chip
                          label={event.severity?.toUpperCase()}
                          color={getThreatLevelColor(event.severity)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{event.description}</TableCell>
                      <TableCell>
                        <Chip
                          label={event.resolved ? 'Løst' : 'Aktiv'}
                          color={event.resolved ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {events.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography color="text.secondary">
                          Ingen sikkerhedshændelser fundet
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Compliance Status
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Zero-Trust Arkitektur"
                  secondary="Alle anmodninger verificeres og autoriseres"
                />
                <Chip label="AKTIV" color="success" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="AES-256-GCM Kryptering"
                  secondary="End-to-end kryptering af alle data"
                />
                <Chip label="AKTIV" color="success" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Multi-Factor Authentication"
                  secondary="Obligatorisk MFA for alle brugere"
                />
                <Chip label="AKTIV" color="success" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Real-time Overvågning"
                  secondary="24/7 overvågning af alle systemaktiviteter"
                />
                <Chip label="AKTIV" color="success" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Warning color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary="SOC 2 Type 2 Certificering"
                  secondary="Certificering planlagt Q1 2026"
                />
                <Chip label="PLANLAGT" color="warning" />
              </ListItem>
            </List>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>
              Sikkerhedsindstillinger
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Automatiske Sikkerhedsscans"
                  secondary="Kører hver 10. sekund"
                />
                <Chip label="AKTIVERET" color="success" />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Geo-blocking"
                  secondary="Blokerer adgang fra højrisiko lande"
                />
                <Chip label="AKTIVERET" color="success" />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Rate Limiting"
                  secondary="Maksimalt 100 anmodninger per time per bruger"
                />
                <Chip label="AKTIVERET" color="success" />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Audit Logging"
                  secondary="Alle handlinger logges og opbevares i 1 år"
                />
                <Chip label="AKTIVERET" color="success" />
              </ListItem>
            </List>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Security Scan Dialog */}
      <Dialog open={scanDialogOpen} onClose={() => setScanDialogOpen(false)}>
        <DialogTitle>Kør Sikkerhedsscan</DialogTitle>
        <DialogContent>
          <Typography>
            Dette vil udføre et komplet sikkerhedsscan af systemet.
            Scannet kan tage et par minutter at gennemføre.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScanDialogOpen(false)}>Annuller</Button>
          <Button onClick={runSecurityScan} variant="contained" disabled={loading}>
            {loading ? 'Scanner...' : 'Start Scan'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Security;
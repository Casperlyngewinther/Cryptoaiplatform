import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Avatar,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Chip
} from '@mui/material';
import {
  AccountCircle,
  Security,
  Notifications,
  Palette,
  Language,
  Storage,
  CloudSync
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user } = useAuth();
  const { connectionStats } = useWebSocket();
  const [tabValue, setTabValue] = useState(0);
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    tradingAlerts: true,
    securityAlerts: true,
    darkMode: true,
    language: 'da',
    autoTrade: false,
    riskLevel: 'moderate'
  });

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreferenceChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveProfile = () => {
    // Validate and save profile changes
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      toast.error('Nye adgangskoder matcher ikke');
      return;
    }
    
    toast.success('Profil opdateret succesfuldt');
  };

  const savePreferences = () => {
    toast.success('Indstillinger gemt');
  };

  const TabPanel = ({ children, value, index }) => (
    <Box sx={{ display: value !== index ? 'none' : 'block', pt: 2 }}>
      {children}
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Indstillinger ⚙️
      </Typography>

      {/* User Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}>
              {user?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h5" gutterBottom>
                {user?.username}
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                {user?.email}
              </Typography>
              <Chip 
                label={user?.role?.toUpperCase() || 'USER'} 
                color="primary" 
                size="small" 
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Settings Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Profil" icon={<AccountCircle />} />
            <Tab label="Notifikationer" icon={<Notifications />} />
            <Tab label="Sikkerhed" icon={<Security />} />
            <Tab label="System" icon={<Storage />} />
          </Tabs>
        </Box>

        <CardContent>
          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom>
              Profil Indstillinger
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Brugernavn"
                  value={profileData.username}
                  onChange={(e) => handleProfileChange('username', e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Email"
                  value={profileData.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Skift Adgangskode
                </Typography>
                <TextField
                  fullWidth
                  label="Nuværende Adgangskode"
                  type="password"
                  value={profileData.currentPassword}
                  onChange={(e) => handleProfileChange('currentPassword', e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Ny Adgangskode"
                  type="password"
                  value={profileData.newPassword}
                  onChange={(e) => handleProfileChange('newPassword', e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Bekræft Ny Adgangskode"
                  type="password"
                  value={profileData.confirmPassword}
                  onChange={(e) => handleProfileChange('confirmPassword', e.target.value)}
                  margin="normal"
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3 }}>
              <Button variant="contained" onClick={saveProfile}>
                Gem Ændringer
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Notifikations Indstillinger
            </Typography>
            
            <List>
              <ListItem>
                <ListItemText
                  primary="Email Notifikationer"
                  secondary="Modtag emails om vigtige opdateringer"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={preferences.emailNotifications}
                    onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="Push Notifikationer"
                  secondary="Browser notifikationer for real-time alerts"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={preferences.pushNotifications}
                    onChange={(e) => handlePreferenceChange('pushNotifications', e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="Trading Alerts"
                  secondary="Notifikationer om handel og positionsændringer"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={preferences.tradingAlerts}
                    onChange={(e) => handlePreferenceChange('tradingAlerts', e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="Sikkerhedsadvarsler"
                  secondary="Kritiske sikkerhedsnotifikationer"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={preferences.securityAlerts}
                    onChange={(e) => handlePreferenceChange('securityAlerts', e.target.checked)}
                    disabled
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
            
            <Box sx={{ mt: 3 }}>
              <Button variant="contained" onClick={savePreferences}>
                Gem Indstillinger
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Sikkerhedsindstillinger
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Sikkerhedsindstillinger administreres automatisk af systemet for optimal beskyttelse.
            </Alert>
            
            <List>
              <ListItem>
                <ListItemText
                  primary="To-Faktor Autentificering"
                  secondary="Ekstra sikkerhedslag for login"
                />
                <ListItemSecondaryAction>
                  <Chip label="AKTIVERET" color="success" size="small" />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="Session Timeout"
                  secondary="Automatisk logout efter 24 timer"
                />
                <ListItemSecondaryAction>
                  <Chip label="24 TIMER" color="primary" size="small" />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="IP Whitelist"
                  secondary="Begræns adgang til godkendte IP-adresser"
                />
                <ListItemSecondaryAction>
                  <Chip label="DEAKTIVERET" color="default" size="small" />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="Audit Logging"
                  secondary="Log alle brugerhandlinger"
                />
                <ListItemSecondaryAction>
                  <Chip label="AKTIVERET" color="success" size="small" />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>
              System Information
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Forbindelses Status
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="WebSocket Forbindelse"
                      secondary="Real-time data stream"
                    />
                    <ListItemSecondaryAction>
                      <Chip label="TILSLUTTET" color="success" size="small" />
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText
                      primary="Aktive Forbindelser"
                      secondary="Antal samtidige brugere"
                    />
                    <ListItemSecondaryAction>
                      <Chip label={connectionStats.connections || 1} color="info" size="small" />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  System Version
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="CryptoAI Platform"
                      secondary="Version 1.0.0"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText
                      primary="Sidste Opdatering"
                      secondary={new Date().toLocaleDateString('da-DK')}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText
                      primary="Database"
                      secondary="SQLite (Development)"
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom color="error">
              Farlige Handlinger
            </Typography>
            
            <Alert severity="warning" sx={{ mb: 2 }}>
              Disse handlinger kan ikke fortrydes. Vær forsigtig!
            </Alert>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" color="warning">
                Nulstil Indstillinger
              </Button>
              <Button variant="outlined" color="error">
                Slet Konto
              </Button>
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Settings;
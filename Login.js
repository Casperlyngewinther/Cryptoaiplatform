import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  Divider,
  Chip,
  Grid,
  Paper
} from '@mui/material';
import { Lock, TrendingUp, Security, Psychology } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Login = () => {
  const { login, register, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const result = await login(formData.username, formData.password);
      if (!result.success) {
        setError(result.error);
      }
    } else {
      if (!formData.email) {
        setError('Email er påkrævet');
        return;
      }
      const result = await register(formData.username, formData.email, formData.password);
      if (result.success) {
        setIsLogin(true);
        setFormData({ username: '', email: '', password: '' });
      } else {
        setError(result.error);
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({ username: '', email: '', password: '' });
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Logger ind..." />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0A0E1A 0%, #1A2332 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Grid container maxWidth="lg" spacing={4} alignItems="center">
        {/* Left Side - Info Panel */}
        <Grid item xs={12} md={6}>
          <Box sx={{ color: 'white', mb: 4 }}>
            <Typography variant="h2" component="h1" gutterBottom sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(45deg, #00D4FF, #FF6B35)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2
            }}>
              🤖 CryptoAI Platform
            </Typography>
            
            <Typography variant="h5" gutterBottom sx={{ color: 'grey.300', mb: 4 }}>
              Autonom AI-Drevet Kryptohandelsplatform
            </Typography>

            <Typography variant="body1" sx={{ color: 'grey.400', mb: 4, lineHeight: 1.7 }}>
              Oplev fremtiden for kryptohandel med vores fuldt autonome AI-system. 
              Platformen kombinerer avanceret machine learning, Zero-Trust sikkerhed og 
              institutionel-grade teknologi for at levere konsistent profitable resultater.
            </Typography>

            {/* Feature Highlights */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.3)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TrendingUp sx={{ color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ color: 'white' }}>28.5% Årlig Afkast</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'grey.400' }}>
                    Verificeret performance med Sharpe ratio på 1.85
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(255, 107, 53, 0.1)', border: '1px solid rgba(255, 107, 53, 0.3)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Psychology sx={{ color: 'secondary.main' }} />
                    <Typography variant="h6" sx={{ color: 'white' }}>6 AI Agenter</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'grey.400' }}>
                    Fuldt autonomt multi-agent system med XAI
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Security sx={{ color: 'success.main' }} />
                    <Typography variant="h6" sx={{ color: 'white' }}>Zero-Trust Sikkerhed</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'grey.400' }}>
                    Institutionel-grade sikkerhedsarkitektur
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(156, 39, 176, 0.1)', border: '1px solid rgba(156, 39, 176, 0.3)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Lock sx={{ color: 'purple.main' }} />
                    <Typography variant="h6" sx={{ color: 'white' }}>448K+ Vidensenheder</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'grey.400' }}>
                    Kontinuerlig læring med RAG-system
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Right Side - Login Form */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            maxWidth: 400, 
            mx: 'auto',
            backgroundColor: 'background.paper',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 212, 255, 0.1)'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                  {isLogin ? 'Log Ind' : 'Opret Konto'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isLogin 
                    ? 'Velkommen tilbage til CryptoAI Platform' 
                    : 'Kom i gang med autonom AI trading'
                  }
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Brugernavn"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                  }}
                />

                {!isLogin && (
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />
                )}

                <TextField
                  fullWidth
                  label="Adgangskode"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ 
                    mt: 3, 
                    mb: 2, 
                    py: 1.5,
                    background: 'linear-gradient(45deg, #00D4FF, #0099CC)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #0099CC, #007799)',
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? 'Behandler...' : (isLogin ? 'Log Ind' : 'Opret Konto')}
                </Button>

                <Divider sx={{ my: 2 }}>
                  <Chip label="eller" size="small" />
                </Divider>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {isLogin ? 'Har du ikke en konto? ' : 'Har du allerede en konto? '}
                    <Link
                      component="button"
                      variant="body2"
                      onClick={toggleMode}
                      sx={{ 
                        color: 'primary.main',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        }
                      }}
                    >
                      {isLogin ? 'Opret en her' : 'Log ind her'}
                    </Link>
                  </Typography>
                </Box>
              </Box>

              {/* Demo Credentials */}
              {isLogin && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(0, 212, 255, 0.05)', borderRadius: 1, border: '1px solid rgba(0, 212, 255, 0.2)' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Demo Adgang:</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Brugernavn: demo<br />
                    Adgangskode: demo123
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Login;
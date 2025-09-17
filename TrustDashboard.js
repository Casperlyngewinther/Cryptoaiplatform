import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Button,
  Alert,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  AccountBalance,
  Security,
  TrendingUp,
  NetworkCheck,
  Dashboard,
  Assessment
} from '@mui/icons-material';
import LoadingSpinner from '../components/common/LoadingSpinner';

const TrustDashboard = () => {
  const [exchangeStatus, setExchangeStatus] = useState({});
  const [portfolio, setPortfolio] = useState(null);
  const [riskMetrics, setRiskMetrics] = useState(null);
  const [dataSourcesStatus, setDataSourcesStatus] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [errors, setErrors] = useState([]);

  // Fetch real-time data
  const fetchData = async () => {
    try {
      setErrors([]);
      const responses = await Promise.allSettled([
        fetch('/api/dashboard/exchanges/status').then(r => r.json()),
        fetch('/api/dashboard/portfolio/real').then(r => r.json()),
        fetch('/api/dashboard/risk/metrics').then(r => r.json()),
        fetch('/api/dashboard/data-sources/status').then(r => r.json()),
        fetch('/api/dashboard/system/health').then(r => r.json())
      ]);

      const [exchangeRes, portfolioRes, riskRes, dataSourcesRes, healthRes] = responses;

      if (exchangeRes.status === 'fulfilled' && exchangeRes.value.success) {
        setExchangeStatus(exchangeRes.value);
      } else {
        setErrors(prev => [...prev, 'Failed to fetch exchange status']);
      }

      if (portfolioRes.status === 'fulfilled' && portfolioRes.value.success) {
        setPortfolio(portfolioRes.value.portfolio);
      } else {
        setErrors(prev => [...prev, 'Failed to fetch portfolio data']);
      }

      if (riskRes.status === 'fulfilled' && riskRes.value.success) {
        setRiskMetrics(riskRes.value.metrics);
      } else {
        setErrors(prev => [...prev, 'Failed to fetch risk metrics']);
      }

      if (dataSourcesRes.status === 'fulfilled' && dataSourcesRes.value.success) {
        setDataSourcesStatus(dataSourcesRes.value.dataSources);
      } else {
        setErrors(prev => [...prev, 'Failed to fetch data sources']);
      }

      if (healthRes.status === 'fulfilled' && healthRes.value.success) {
        setSystemHealth(healthRes.value.health);
      } else {
        setErrors(prev => [...prev, 'Failed to fetch system health']);
      }

      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Data fetch error:', error);
      setErrors(prev => [...prev, 'Network error occurred']);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Update every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LoadingSpinner message="Indlæser reelle dashboard data..." />
      </Box>
    );
  }

  const MetricCard = ({ title, value, subtitle, icon, color = 'primary', status = 'neutral' }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography color="text.secondary" variant="body2">
            {title}
          </Typography>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 32, height: 32 }}>
            {icon}
          </Avatar>
        </Box>
        <Typography variant="h4" component="div" gutterBottom>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header with Honest Reporting */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          🎯 Trust Dashboard - Ærlig Rapportering
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Viser kun faktiske, verificerede data uden falske positive
        </Typography>
        {lastUpdate && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Sidst opdateret: {lastUpdate.toLocaleTimeString('da-DK')}
          </Typography>
        )}
      </Box>

      {/* Error Display */}
      {errors.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Advarsel: {errors.join(', ')}
        </Alert>
      )}

      {/* Real Portfolio Status */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Faktisk Portfolio Værdi"
            value={portfolio ? `$${portfolio.totalValue.toFixed(2)}` : '$0.00'}
            subtitle="Real-time verified balance"
            icon={<AccountBalance />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Portfolio VaR (1d)"
            value={riskMetrics ? `$${riskMetrics.portfolioVaR}` : '$0.00'}
            subtitle={`Risk Score: ${riskMetrics?.riskScore || 0}/10`}
            icon={<Assessment />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Fungerende Børser"
            value={`${exchangeStatus.summary?.working || 0}`}
            subtitle={`${exchangeStatus.summary?.connected || 0} forbundet`}
            icon={<NetworkCheck />}
            color={exchangeStatus.summary?.working > 0 ? 'success' : 'error'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="System Status"
            value={systemHealth?.status === 'operational' ? 'Operationel' : 'Begrænset'}
            subtitle={`Uptime: ${Math.floor((systemHealth?.uptime || 0) / 3600)}h`}
            icon={<Security />}
            color={systemHealth?.status === 'operational' ? 'success' : 'warning'}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Real Portfolio Holdings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Faktiske Holdings
              </Typography>
              {portfolio && portfolio.currencies ? (
                <List>
                  {Object.entries(portfolio.currencies).map(([currency, data], index) => (
                    <React.Fragment key={currency}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: currency === 'USDT' ? 'success.main' : 'warning.main' }}>
                            {currency.substring(0, 2)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${currency}: ${data.total}`}
                          secondary={`USD Værdi: $${data.usdValue.toFixed(2)}`}
                        />
                      </ListItem>
                      {index < Object.keys(portfolio.currencies).length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">Ingen portfolio data tilgængelig</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Working Exchanges Only */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🔗 Fungerende Børser (Ærlig Status)
              </Typography>
              {exchangeStatus.exchanges && Object.keys(exchangeStatus.exchanges).length > 0 ? (
                <List>
                  {Object.entries(exchangeStatus.exchanges).map(([name, exchange], index) => (
                    <React.Fragment key={name}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: exchange.connected ? 'success.main' : 'error.main' }}>
                            <CheckCircle />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={exchange.description || name.toUpperCase()}
                          secondary={`Status: ${exchange.status} | Latency: ${exchange.latency}`}
                        />
                        <Chip
                          label="Operationel"
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      </ListItem>
                      {index < Object.keys(exchangeStatus.exchanges).length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.light' }}>
                  <Warning sx={{ fontSize: 40, color: 'warning.dark', mb: 1 }} />
                  <Typography variant="h6" color="warning.dark">
                    Ingen verificerede børser
                  </Typography>
                  <Typography variant="body2" color="warning.dark">
                    Alle børser er enten offline eller har ugyldige credentials
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Risk Management Display */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ⚠️ Risk Management
              </Typography>
              {riskMetrics ? (
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Risk Level</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={(riskMetrics.riskScore / 10) * 100}
                        sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                        color={riskMetrics.riskScore <= 3 ? 'success' : riskMetrics.riskScore <= 6 ? 'warning' : 'error'}
                      />
                      <Typography variant="body2">{riskMetrics.riskLevel}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Portfolio VaR</Typography>
                      <Typography variant="h6">${riskMetrics.portfolioVaR}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Volatility</Typography>
                      <Typography variant="h6">{riskMetrics.volatility}%</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Diversification</Typography>
                      <Typography variant="h6">{(riskMetrics.diversificationScore * 100).toFixed(0)}%</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Positions</Typography>
                      <Typography variant="h6">{riskMetrics.positions}</Typography>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Typography color="text.secondary">Risk metrics ikke tilgængelige</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Data Sources Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📡 Real-time Data Sources
              </Typography>
              {dataSourcesStatus ? (
                <Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Exchange Data</Typography>
                      <Typography variant="h6">
                        {dataSourcesStatus.exchanges.providing_data}/{dataSourcesStatus.exchanges.total}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">External APIs</Typography>
                      <Typography variant="h6">
                        {dataSourcesStatus.external_apis.status === 'operational' ? '✓' : '✗'} CoinGecko
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Typography color="text.secondary">Data source status ikke tilgængelig</Typography>
              )}
              <Button 
                variant="outlined" 
                size="small" 
                onClick={fetchData}
                sx={{ mt: 2 }}
              >
                🔄 Refresh Data
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TrustDashboard;

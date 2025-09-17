import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Button,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Psychology,
  Security,
  AccountBalance,
  Warning,
  CheckCircle,
  Error,
  Analytics,
  Speed
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
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const { portfolio, aiDecisions, securityEvents, systemHealth, marketData, isConnected } = useWebSocket();
  const [performanceData, setPerformanceData] = useState([]);

  // Generate sample performance data
  useEffect(() => {
    const generatePerformanceData = () => {
      const data = [];
      let baseValue = 250000;
      const now = new Date();
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // Simulate daily returns with upward trend (28.5% annual)
        const dailyReturn = (Math.random() - 0.45) * 0.02; // Slight positive bias
        baseValue *= (1 + dailyReturn);
        
        data.push({
          date: date.toLocaleDateString('da-DK', { month: 'short', day: 'numeric' }),
          value: Math.round(baseValue),
          return: (dailyReturn * 100).toFixed(2)
        });
      }
      
      return data;
    };

    setPerformanceData(generatePerformanceData());
  }, []);

  if (!isConnected) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Forbindelse til serveren afbrudt. Forsøger at genoprette forbindelse...
        </Alert>
        <LoadingSpinner message="Opretter forbindelse til CryptoAI Platform..." />
      </Box>
    );
  }

  const portfolioValue = portfolio?.totalValue || 250000;
  const totalReturn = portfolio?.pnl?.percentage || 28.5;
  const dailyReturn = portfolio?.pnl?.daily || 2840;
  const activePositions = portfolio?.positionCount || 0;

  // AI Agent Status Summary
  const aiAgentStats = {
    total: 6,
    active: 6,
    avgConfidence: 0.78,
    totalDecisions: aiDecisions?.length || 0
  };

  // Security Status
  const securityStatus = {
    threatLevel: 'low',
    activeAlerts: securityEvents?.filter(e => !e.resolved)?.length || 0,
    lastScan: new Date()
  };

  // Market Overview Data
  const marketOverview = marketData?.slice(0, 5) || [
    { symbol: 'BTC/USDT', price: 45250, change24h: 2.4 },
    { symbol: 'ETH/USDT', price: 3180, change24h: 1.8 },
    { symbol: 'ADA/USDT', price: 0.82, change24h: -0.5 },
    { symbol: 'DOT/USDT', price: 24.8, change24h: 3.2 },
    { symbol: 'SOL/USDT', price: 118, change24h: 1.9 }
  ];

  // Portfolio Distribution Data
  const portfolioDistribution = [
    { name: 'Bitcoin', value: 35, color: '#FF9800' },
    { name: 'Ethereum', value: 25, color: '#00D4FF' },
    { name: 'Altcoins', value: 20, color: '#FF6B35' },
    { name: 'Cash', value: 20, color: '#4CAF50' }
  ];

  const MetricCard = ({ title, value, change, icon, positive = true, subtitle }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography color="text.secondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Avatar sx={{ bgcolor: positive ? 'success.main' : 'error.main', width: 32, height: 32 }}>
            {icon}
          </Avatar>
        </Box>
        <Typography variant="h4" component="div" gutterBottom>
          {value}
        </Typography>
        {change && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {positive ? <TrendingUp color="success" /> : <TrendingDown color="error" />}
            <Typography 
              variant="body2" 
              color={positive ? 'success.main' : 'error.main'}
            >
              {change}
            </Typography>
          </Box>
        )}
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Velkommen tilbage, {user?.username}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Her er et overblik over din CryptoAI Platform performance
        </Typography>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Portfolio Værdi"
            value={`$${portfolioValue.toLocaleString()}`}
            change={`+${Math.abs(dailyReturn).toLocaleString()} DKK i dag`}
            icon={<AccountBalance />}
            positive={dailyReturn >= 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Afkast"
            value={`${totalReturn.toFixed(1)}%`}
            change="Årlig performance"
            icon={<TrendingUp />}
            positive={totalReturn >= 0}
            subtitle="Sharpe Ratio: 1.85"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Aktive AI Agenter"
            value={`${aiAgentStats.active}/${aiAgentStats.total}`}
            change={`${(aiAgentStats.avgConfidence * 100).toFixed(0)}% gennemsnitlig tillid`}
            icon={<Psychology />}
            subtitle={`${aiAgentStats.totalDecisions} beslutninger i dag`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Sikkerhedsstatus"
            value={securityStatus.threatLevel === 'low' ? 'Sikker' : 'Advarsel'}
            change={`${securityStatus.activeAlerts} aktive advarsler`}
            icon={<Security />}
            positive={securityStatus.threatLevel === 'low'}
            subtitle="Sidste scan: Nu"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Portfolio Performance Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Portfolio Performance (30 dage)
              </Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
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
                      dataKey="value" 
                      stroke="#00D4FF" 
                      strokeWidth={2}
                      dot={{ fill: '#00D4FF', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Portfolio Distribution */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Portfolio Fordeling
              </Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={portfolioDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {portfolioDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ mt: 2 }}>
                {portfolioDistribution.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, bgcolor: item.color, borderRadius: '50%' }} />
                      <Typography variant="body2">{item.name}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">{item.value}%</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Market Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Markedsoverblik
              </Typography>
              <List>
                {marketOverview.map((market, index) => (
                  <React.Fragment key={market.symbol}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {market.symbol.split('/')[0].substring(0, 2)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={market.symbol}
                        secondary={`$${market.price?.toLocaleString() || 'N/A'}`}
                      />
                      <Chip
                        label={`${market.change24h >= 0 ? '+' : ''}${market.change24h?.toFixed(1) || '0.0'}%`}
                        color={market.change24h >= 0 ? 'success' : 'error'}
                        size="small"
                        variant="outlined"
                      />
                    </ListItem>
                    {index < marketOverview.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent AI Decisions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Seneste AI Beslutninger
              </Typography>
              <List>
                {(aiDecisions?.slice(0, 5) || [
                  { agentName: 'Market Analysis Agent', type: 'market_analysis', confidence: 0.85, timestamp: new Date() },
                  { agentName: 'Risk Management Agent', type: 'risk_assessment', confidence: 0.78, timestamp: new Date() },
                  { agentName: 'Execution Agent', type: 'trade_execution', confidence: 0.92, timestamp: new Date() }
                ]).map((decision, index) => (
                  <React.Fragment key={index}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          <Psychology />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={decision.agentName || 'AI Agent'}
                        secondary={`${decision.type || 'decision'} - ${new Date(decision.timestamp).toLocaleTimeString('da-DK')}`}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={(decision.confidence || 0) * 100}
                          sx={{ width: 60, height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {((decision.confidence || 0) * 100).toFixed(0)}%
                        </Typography>
                      </Box>
                    </ListItem>
                    {index < 4 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* System Health */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  System Status
                </Typography>
                <Chip
                  label={isConnected ? 'Online' : 'Offline'}
                  color={isConnected ? 'success' : 'error'}
                  icon={isConnected ? <CheckCircle /> : <Error />}
                />
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                      <Psychology />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">AI System</Typography>
                    <Typography variant="h6" color={systemHealth?.services?.ai ? 'success.main' : 'error.main'}>
                      {systemHealth?.services?.ai ? 'Aktiv' : 'Offline'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', mx: 'auto', mb: 1 }}>
                      <TrendingUp />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">Trading</Typography>
                    <Typography variant="h6" color={systemHealth?.services?.trading ? 'success.main' : 'error.main'}>
                      {systemHealth?.services?.trading ? 'Aktiv' : 'Offline'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                      <Security />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">Sikkerhed</Typography>
                    <Typography variant="h6" color={systemHealth?.services?.security ? 'success.main' : 'error.main'}>
                      {systemHealth?.services?.security ? 'Aktiv' : 'Offline'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1 }}>
                      <Speed />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">Uptime</Typography>
                    <Typography variant="h6" color="success.main">
                      {systemHealth?.uptime ? `${Math.floor(systemHealth.uptime / 3600)}h` : '24h'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
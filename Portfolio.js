import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Avatar,
  Button
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  Timeline
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar
} from 'recharts';
import { useWebSocket } from '../contexts/WebSocketContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Portfolio = () => {
  const { portfolio, marketData, isConnected } = useWebSocket();
  const [performanceData, setPerformanceData] = useState([]);

  useEffect(() => {
    // Generate portfolio performance data
    const data = [];
    let value = 250000;
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      value *= (1 + (Math.random() - 0.45) * 0.02);
      data.push({
        date: date.toLocaleDateString('da-DK', { month: 'short', day: 'numeric' }),
        value: Math.round(value)
      });
    }
    setPerformanceData(data);
  }, []);

  if (!isConnected) {
    return <LoadingSpinner message="Henter portfolio data..." />;
  }

  const portfolioValue = portfolio?.totalValue || 250000;
  const totalReturn = portfolio?.pnl?.percentage || 28.5;
  const positions = portfolio?.positions || [];
  const cash = portfolio?.cash || 100000;

  const assetAllocation = [
    { name: 'Bitcoin', value: 35, amount: portfolioValue * 0.35, color: '#FF9800' },
    { name: 'Ethereum', value: 25, amount: portfolioValue * 0.25, color: '#00D4FF' },
    { name: 'Altcoins', value: 20, amount: portfolioValue * 0.20, color: '#FF6B35' },
    { name: 'Cash', value: 20, amount: cash, color: '#4CAF50' }
  ];

  const performanceMetrics = [
    { label: 'Total Afkast', value: `${totalReturn.toFixed(1)}%`, positive: totalReturn >= 0 },
    { label: 'Sharpe Ratio', value: '1.85', positive: true },
    { label: 'Max Drawdown', value: '4.2%', positive: false },
    { label: 'Win Rate', value: '68.4%', positive: true },
    { label: 'Volatilitet', value: '12.3%', positive: false },
    { label: 'Beta', value: '0.89', positive: true }
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Portfolio Oversigt 💼
      </Typography>

      {/* Portfolio Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AccountBalance sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" gutterBottom>
                ${portfolioValue.toLocaleString()}
              </Typography>
              <Typography color="text.secondary">
                Total Portfolio Værdi
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" gutterBottom color="success.main">
                +{totalReturn.toFixed(1)}%
              </Typography>
              <Typography color="text.secondary">
                Total Afkast
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PieChartIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h4" gutterBottom>
                {positions.length}
              </Typography>
              <Typography color="text.secondary">
                Aktive Positioner
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Timeline sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" gutterBottom>
                ${cash.toLocaleString()}
              </Typography>
              <Typography color="text.secondary">
                Tilgængelig Cash
              </Typography>
            </CardContent>
          </Card>
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
              <Box sx={{ height: 400, mt: 2 }}>
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
                      strokeWidth={3}
                      dot={{ fill: '#00D4FF', strokeWidth: 2, r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Asset Allocation */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Asset Allokering
              </Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetAllocation}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {assetAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Allokering']} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ mt: 2 }}>
                {assetAllocation.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, bgcolor: item.color, borderRadius: '50%' }} />
                      <Typography variant="body2">{item.name}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2">{item.value}%</Typography>
                      <Typography variant="caption" color="text.secondary">
                        ${item.amount.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Nøgletal
              </Typography>
              <Grid container spacing={2}>
                {performanceMetrics.map((metric, index) => (
                  <Grid item xs={6} key={index}>
                    <Box sx={{ p: 2, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <Typography variant="h5" color={metric.positive ? 'success.main' : 'text.primary'} gutterBottom>
                        {metric.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {metric.label}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Holdings Table */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Aktuelle Beholdninger
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Asset</TableCell>
                      <TableCell align="right">Mængde</TableCell>
                      <TableCell align="right">Værdi</TableCell>
                      <TableCell align="right">P&L</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {positions.map((position, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
                              {position.symbol?.split('/')[0]?.substring(0, 2)}
                            </Avatar>
                            {position.symbol}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {position.amount?.toFixed(4)}
                        </TableCell>
                        <TableCell align="right">
                          ${(position.amount * position.currentPrice)?.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          <Typography color={position.pnl >= 0 ? 'success.main' : 'error.main'}>
                            ${position.pnl?.toLocaleString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                    {positions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography color="text.secondary">
                            Ingen aktive positioner
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Portfolio;
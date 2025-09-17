import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  TrendingUp,
  Assessment,
  Security,
  Speed,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import axios from 'axios';

const Analytics = () => {
  const [tabValue, setTabValue] = useState(0);
  const [timePeriod, setTimePeriod] = useState('30d');
  const [performanceData, setPerformanceData] = useState([]);
  const [riskMetrics, setRiskMetrics] = useState({});
  const [aiAnalytics, setAiAnalytics] = useState({});
  const [marketAnalytics, setMarketAnalytics] = useState({});

  useEffect(() => {
    fetchAnalytics();
  }, [timePeriod]);

  const fetchAnalytics = async () => {
    try {
      const [performance, risk, ai, market] = await Promise.all([
        axios.get(`/api/analytics/performance?period=${timePeriod}`),
        axios.get('/api/analytics/risk'),
        axios.get('/api/analytics/ai'),
        axios.get('/api/analytics/market')
      ]);
      
      setPerformanceData(performance.data.performance || []);
      setRiskMetrics(risk.data.risk || {});
      setAiAnalytics(ai.data.ai || {});
      setMarketAnalytics(market.data.market || {});
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const riskData = [
    { name: 'Portfolio Risk', current: 15, limit: 20 },
    { name: 'Market Risk', current: 12, limit: 15 },
    { name: 'Liquidity Risk', current: 8, limit: 10 },
    { name: 'Concentration Risk', current: 18, limit: 25 }
  ];

  const aiPerformanceData = [
    { agent: 'Master Agent', efficiency: 92, decisions: 156 },
    { agent: 'Market Analyzer', efficiency: 88, decisions: 234 },
    { agent: 'Risk Manager', efficiency: 95, decisions: 89 },
    { agent: 'Executor', efficiency: 91, decisions: 178 },
    { agent: 'Verifier', efficiency: 97, decisions: 123 },
    { agent: 'Learner', efficiency: 85, decisions: 67 }
  ];

  const TabPanel = ({ children, value, index }) => (
    <Box sx={{ display: value !== index ? 'none' : 'block', pt: 2 }}>
      {children}
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Analytics Dashboard 📊
      </Typography>

      {/* Controls */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Tidsperiode</InputLabel>
          <Select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            label="Tidsperiode"
          >
            <MenuItem value="7d">7 dage</MenuItem>
            <MenuItem value="30d">30 dage</MenuItem>
            <MenuItem value="90d">90 dage</MenuItem>
            <MenuItem value="1y">1 år</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Analytics Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Performance" icon={<TrendingUp />} />
            <Tab label="Risk Analyse" icon={<Security />} />
            <Tab label="AI Analytics" icon={<Assessment />} />
            <Tab label="Marked Analyse" icon={<PieChartIcon />} />
          </Tabs>
        </Box>

        <CardContent>
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              {/* Performance Chart */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Portfolio Performance ({timePeriod})
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
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
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#00D4FF" 
                        fill="rgba(0, 212, 255, 0.1)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>

              {/* Key Metrics */}
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <Typography variant="h4" color="success.main">28.5%</Typography>
                      <Typography variant="body2" color="text.secondary">Årlig Afkast</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <Typography variant="h4" color="primary.main">1.85</Typography>
                      <Typography variant="body2" color="text.secondary">Sharpe Ratio</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <Typography variant="h4" color="warning.main">4.2%</Typography>
                      <Typography variant="body2" color="text.secondary">Max Drawdown</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <Typography variant="h4" color="success.main">68.4%</Typography>
                      <Typography variant="body2" color="text.secondary">Win Rate</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              {/* Risk Metrics Chart */}
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>
                  Risk Metrics
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={riskData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip />
                      <Bar dataKey="current" fill="#FF6B35" name="Nuværende" />
                      <Bar dataKey="limit" fill="#374151" name="Grænse" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>

              {/* Risk Summary */}
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom>
                  Risk Oversigt
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'success.main', borderRadius: 2, bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
                    <Typography variant="h6" color="success.main">LAV RISIKO</Typography>
                    <Typography variant="body2">Portfolio inden for alle risikogrænser</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" gutterBottom>VaR (95% tillid)</Typography>
                    <Typography>Daglig: $12,500</Typography>
                    <Typography>Ugentlig: $28,900</Typography>
                    <Typography>Månedlig: $45,200</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              {/* AI Agent Performance */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  AI Agent Performance
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Agent</TableCell>
                        <TableCell align="right">Effektivitet</TableCell>
                        <TableCell align="right">Beslutninger</TableCell>
                        <TableCell align="right">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {aiPerformanceData.map((agent, index) => (
                        <TableRow key={index}>
                          <TableCell>{agent.agent}</TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                              <Typography>{agent.efficiency}%</Typography>
                              <Box sx={{ width: 60, height: 6, bgcolor: 'grey.700', borderRadius: 3 }}>
                                <Box 
                                  sx={{ 
                                    width: `${agent.efficiency}%`, 
                                    height: '100%', 
                                    bgcolor: agent.efficiency > 90 ? 'success.main' : 'warning.main',
                                    borderRadius: 3
                                  }} 
                                />
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right">{agent.decisions}</TableCell>
                          <TableCell align="right">
                            <Chip 
                              label="Aktiv" 
                              color="success" 
                              size="small" 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Marked Korrelations Matrix
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Markedsanalyse data vil blive vist her...
                </Typography>
              </Grid>
            </Grid>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Analytics;
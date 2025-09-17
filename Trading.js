import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  PlayArrow,
  Pause,
  Settings,
  Timeline,
  Close
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  CandlestickChart
} from 'recharts';
import { useWebSocket } from '../contexts/WebSocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const Trading = () => {
  const { marketData, portfolio, isConnected } = useWebSocket();
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [orderType, setOrderType] = useState('market');
  const [side, setSide] = useState('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [positions, setPositions] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [blackSwanDialogOpen, setBlackSwanDialogOpen] = useState(false);
  const [blackSwanScenarios, setBlackSwanScenarios] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);

  // Fetch orders and positions
  useEffect(() => {
    fetchOrders();
    fetchPositions();
    fetchBlackSwanScenarios();
    generatePriceHistory();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/trading/orders');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const fetchPositions = async () => {
    try {
      const response = await axios.get('/api/trading/positions');
      setPositions(response.data.positions || []);
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    }
  };

  const fetchBlackSwanScenarios = async () => {
    try {
      const response = await axios.get('/api/trading/black-swan-scenarios');
      setBlackSwanScenarios(response.data.scenarios || []);
    } catch (error) {
      console.error('Failed to fetch Black Swan scenarios:', error);
    }
  };

  const generatePriceHistory = () => {
    const history = [];
    let basePrice = 45000;
    const now = new Date();
    
    for (let i = 99; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 5 * 60 * 1000); // 5-minute intervals
      const change = (Math.random() - 0.5) * 0.02;
      basePrice *= (1 + change);
      
      history.push({
        time: time.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }),
        price: basePrice,
        timestamp: time
      });
    }
    
    setPriceHistory(history);
  };

  const executeOrder = async () => {
    if (!amount || (orderType === 'limit' && !price)) {
      toast.error('Udfyld alle påkrævede felter');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        symbol: selectedSymbol,
        side,
        amount: parseFloat(amount),
        type: orderType,
        ...(orderType === 'limit' && { price: parseFloat(price) })
      };

      const response = await axios.post('/api/trading/order', orderData);
      
      if (response.data.success) {
        toast.success(`Ordre udført: ${side.toUpperCase()} ${amount} ${selectedSymbol}`);
        setAmount('');
        setPrice('');
        fetchOrders();
        fetchPositions();
      } else {
        toast.error(response.data.error || 'Ordre fejlede');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Ordre fejlede');
    } finally {
      setLoading(false);
    }
  };

  const closePosition = async (symbol, percentage = 100) => {
    try {
      const response = await axios.post('/api/trading/close-position', {
        symbol,
        percentage
      });
      
      if (response.data.success) {
        toast.success(`Position lukket: ${percentage}% af ${symbol}`);
        fetchPositions();
      } else {
        toast.error(response.data.error || 'Lukning af position fejlede');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lukning af position fejlede');
    }
  };

  const runBlackSwanTest = async (scenario) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/trading/black-swan-test', { scenario });
      
      if (response.data.success) {
        const result = response.data.result;
        toast.success(
          `Black Swan test gennemført: ${result.passed ? 'BESTÅET' : 'FEJLET'}. 
           Tab: ${(result.loss * 100).toFixed(2)}%`,
          { duration: 6000 }
        );
      } else {
        toast.error(response.data.error || 'Black Swan test fejlede');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Black Swan test fejlede');
    } finally {
      setLoading(false);
      setBlackSwanDialogOpen(false);
    }
  };

  const currentMarketData = marketData?.find(m => m.symbol === selectedSymbol) || {
    symbol: selectedSymbol,
    price: 45000,
    change24h: 2.4,
    volume: 2500000000,
    bid: 44950,
    ask: 45050
  };

  const TabPanel = ({ children, value, index }) => (
    <Box sx={{ display: value !== index ? 'none' : 'block', pt: 2 }}>
      {children}
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Trading Dashboard 📈
      </Typography>

      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Forbindelse til real-time data afbrudt. Trading kan være påvirket.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Price Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  {selectedSymbol} - ${currentMarketData.price?.toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={`${currentMarketData.change24h >= 0 ? '+' : ''}${currentMarketData.change24h?.toFixed(2)}%`}
                    color={currentMarketData.change24h >= 0 ? 'success' : 'error'}
                    icon={currentMarketData.change24h >= 0 ? <TrendingUp /> : <TrendingDown />}
                  />
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={selectedSymbol}
                      onChange={(e) => setSelectedSymbol(e.target.value)}
                    >
                      {(marketData || [
                        { symbol: 'BTC/USDT' },
                        { symbol: 'ETH/USDT' },
                        { symbol: 'ADA/USDT' },
                        { symbol: 'DOT/USDT' },
                        { symbol: 'SOL/USDT' }
                      ]).map((market) => (
                        <MenuItem key={market.symbol} value={market.symbol}>
                          {market.symbol}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" domain={['dataMin - 1000', 'dataMax + 1000']} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Pris']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#00D4FF" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Order Form */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Placer Ordre
              </Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Ordre Type</InputLabel>
                <Select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  label="Ordre Type"
                >
                  <MenuItem value="market">Market</MenuItem>
                  <MenuItem value="limit">Limit</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Side</InputLabel>
                <Select
                  value={side}
                  onChange={(e) => setSide(e.target.value)}
                  label="Side"
                >
                  <MenuItem value="buy">Køb</MenuItem>
                  <MenuItem value="sell">Sælg</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Mængde"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                margin="normal"
                step="0.00001"
              />

              {orderType === 'limit' && (
                <TextField
                  fullWidth
                  label="Pris"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  margin="normal"
                  step="0.01"
                />
              )}

              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Estimeret værdi: ${((parseFloat(amount) || 0) * currentMarketData.price).toLocaleString()}
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                onClick={executeOrder}
                disabled={loading || !isConnected}
                sx={{ mt: 2 }}
              >
                {loading ? 'Udfører...' : `${side === 'buy' ? 'Køb' : 'Sælg'} ${selectedSymbol}`}
              </Button>

              {/* Market Info */}
              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Markedsinfo
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Bid:</Typography>
                  <Typography variant="body2">${currentMarketData.bid?.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Ask:</Typography>
                  <Typography variant="body2">${currentMarketData.ask?.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">24h Volume:</Typography>
                  <Typography variant="body2">${(currentMarketData.volume / 1000000).toFixed(0)}M</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Orders and Positions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                  <Tab label="Aktive Positioner" />
                  <Tab label="Ordre Historik" />
                  <Tab label="Black Swan Tests" />
                </Tabs>
              </Box>

              <TabPanel value={tabValue} index={0}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Symbol</TableCell>
                        <TableCell>Side</TableCell>
                        <TableCell align="right">Mængde</TableCell>
                        <TableCell align="right">Indkøbspris</TableCell>
                        <TableCell align="right">Nuværende Pris</TableCell>
                        <TableCell align="right">P&L</TableCell>
                        <TableCell align="right">Handlinger</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {positions.map((position, index) => (
                        <TableRow key={index}>
                          <TableCell>{position.symbol}</TableCell>
                          <TableCell>
                            <Chip 
                              label={position.side.toUpperCase()} 
                              color={position.side === 'long' ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">{position.amount}</TableCell>
                          <TableCell align="right">${position.entryPrice?.toLocaleString()}</TableCell>
                          <TableCell align="right">${position.currentPrice?.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            <Typography 
                              color={position.pnl >= 0 ? 'success.main' : 'error.main'}
                              fontWeight="bold"
                            >
                              ${position.pnl?.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => closePosition(position.symbol)}
                            >
                              Luk
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {positions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            <Typography color="text.secondary">
                              Ingen aktive positioner
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Tid</TableCell>
                        <TableCell>Symbol</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Side</TableCell>
                        <TableCell align="right">Mængde</TableCell>
                        <TableCell align="right">Pris</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.slice(0, 10).map((order, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {new Date(order.timestamp || Date.now()).toLocaleString('da-DK')}
                          </TableCell>
                          <TableCell>{order.symbol}</TableCell>
                          <TableCell>{order.type}</TableCell>
                          <TableCell>
                            <Chip 
                              label={order.side?.toUpperCase()} 
                              color={order.side === 'buy' ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">{order.amount}</TableCell>
                          <TableCell align="right">${order.price?.toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip 
                              label={order.status || 'Filled'} 
                              color="success"
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      {orders.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            <Typography color="text.secondary">
                              Ingen ordre historik
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Black Swan Test Scenarier
                  </Typography>
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={() => setBlackSwanDialogOpen(true)}
                    disabled={loading}
                  >
                    Kør Test
                  </Button>
                </Box>
                
                <Alert severity="info" sx={{ mb: 2 }}>
                  Black Swan tests evaluerer systemets modstandsdygtighed mod ekstreme markedsbegivenheder.
                  Tests kører i simuleret miljø og påvirker ikke rigtige positioner.
                </Alert>

                <List>
                  {blackSwanScenarios.map((scenario, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={scenario.name}
                        secondary={scenario.description}
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={scenario.severity?.toUpperCase()}
                          color={
                            scenario.severity === 'critical' ? 'error' :
                            scenario.severity === 'high' ? 'warning' : 'default'
                          }
                          size="small"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Black Swan Test Dialog */}
      <Dialog open={blackSwanDialogOpen} onClose={() => setBlackSwanDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Vælg Black Swan Test Scenarie
          <IconButton
            onClick={() => setBlackSwanDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Vælg et scenarie for at teste systemets modstandsdygtighed:
          </Typography>
          
          <List>
            {blackSwanScenarios.map((scenario, index) => (
              <ListItem key={index} divider>
                <ListItemText
                  primary={scenario.name}
                  secondary={scenario.description}
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={() => runBlackSwanTest(scenario.id)}
                    disabled={loading}
                  >
                    Kør Test
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Trading;
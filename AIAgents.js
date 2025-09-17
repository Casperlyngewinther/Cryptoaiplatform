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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Psychology,
  Speed,
  Security,
  Analytics,
  School,
  VerifiedUser,
  Timeline,
  Lightbulb
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useWebSocket } from '../contexts/WebSocketContext';
import axios from 'axios';

const AIAgents = () => {
  const { aiDecisions } = useWebSocket();
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [knowledgeBase, setKnowledgeBase] = useState([]);
  const [performance, setPerformance] = useState({});

  useEffect(() => {
    fetchAgents();
    fetchKnowledgeBase();
    fetchPerformance();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await axios.get('/api/ai/agents');
      setAgents(response.data.agents || []);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const fetchKnowledgeBase = async () => {
    try {
      const response = await axios.get('/api/ai/knowledge-base');
      setKnowledgeBase(response.data.knowledgeBase || []);
    } catch (error) {
      console.error('Failed to fetch knowledge base:', error);
    }
  };

  const fetchPerformance = async () => {
    try {
      const response = await axios.get('/api/ai/performance');
      setPerformance(response.data.performance || {});
    } catch (error) {
      console.error('Failed to fetch performance:', error);
    }
  };

  const getAgentIcon = (type) => {
    const icons = {
      coordinator: <Psychology />,
      analyzer: <Analytics />,
      risk_manager: <Security />,
      executor: <Speed />,
      verifier: <VerifiedUser />,
      learner: <School />
    };
    return icons[type] || <Psychology />;
  };

  const getAgentColor = (type) => {
    const colors = {
      coordinator: 'primary',
      analyzer: 'secondary',
      risk_manager: 'error',
      executor: 'success',
      verifier: 'warning',
      learner: 'info'
    };
    return colors[type] || 'primary';
  };

  const confidenceData = aiDecisions?.slice(0, 20).map((decision, index) => ({
    time: `T${index + 1}`,
    confidence: decision.confidence * 100
  })) || [];

  const decisionTypeData = [
    { name: 'Market Analysis', value: 35, color: '#00D4FF' },
    { name: 'Risk Assessment', value: 25, color: '#FF6B35' },
    { name: 'Trade Execution', value: 20, color: '#4CAF50' },
    { name: 'Verification', value: 15, color: '#FF9800' },
    { name: 'Learning', value: 5, color: '#9C27B0' }
  ];

  const TabPanel = ({ children, value, index }) => (
    <Box sx={{ display: value !== index ? 'none' : 'block', pt: 2 }}>
      {children}
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        AI Agenter 🤖
      </Typography>

      {/* AI Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Psychology sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" gutterBottom>
                {agents.length}/6
              </Typography>
              <Typography color="text.secondary">
                Aktive Agenter
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Timeline sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" gutterBottom>
                {performance.totalDecisions || 0}
              </Typography>
              <Typography color="text.secondary">
                Beslutninger i dag
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Lightbulb sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" gutterBottom>
                {((performance.avgConfidence || 0) * 100).toFixed(0)}%
              </Typography>
              <Typography color="text.secondary">
                Gns. Tillid
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <School sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" gutterBottom>
                448K+
              </Typography>
              <Typography color="text.secondary">
                Vidensenheder
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Agent Status Cards */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Agent Status
              </Typography>
              <List>
                {agents.map((agent, index) => (
                  <ListItem
                    key={agent.id}
                    button
                    onClick={() => {
                      setSelectedAgent(agent);
                      setDialogOpen(true);
                    }}
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 1 }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: `${getAgentColor(agent.type)}.main` }}>
                        {getAgentIcon(agent.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={agent.name}
                      secondary={`Type: ${agent.type} • Beslutninger: ${agent.performance?.decisions || 0}`}
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                      <Chip
                        label={agent.status}
                        color={agent.status === 'active' ? 'success' : 'error'}
                        size="small"
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={(agent.performance?.successRate || 0) * 100}
                          sx={{ width: 60, height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {((agent.performance?.successRate || 0) * 100).toFixed(0)}%
                        </Typography>
                      </Box>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Confidence Trend */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tillidsniveau Over Tid
              </Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={confidenceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [`${value.toFixed(1)}%`, 'Tillid']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="confidence" 
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

        {/* Decision Types Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Beslutningstyper Fordeling
              </Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={decisionTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                    >
                      {decisionTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Andel']} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ mt: 2 }}>
                {decisionTypeData.map((item, index) => (
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

        {/* Knowledge Base Stats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Videnbase Statistik
              </Typography>
              <List>
                {knowledgeBase.map((kb, index) => (
                  <ListItem key={index} divider>
                    <ListItemText
                      primary={kb.category || `Kategori ${index + 1}`}
                      secondary={`${(kb.entries || 0).toLocaleString()} enheder • ${((kb.accuracy || 0) * 100).toFixed(1)}% nøjagtighed`}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={(kb.accuracy || 0) * 100}
                        sx={{ width: 80, height: 8, borderRadius: 4 }}
                        color={kb.accuracy > 0.9 ? 'success' : kb.accuracy > 0.8 ? 'warning' : 'error'}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {((kb.accuracy || 0) * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Agent Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {selectedAgent?.name} - Detaljer
        </DialogTitle>
        <DialogContent>
          {selectedAgent && (
            <Box>
              <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                <Tab label="Oversigt" />
                <Tab label="Performance" />
                <Tab label="Konfiguration" />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Agent Information</Typography>
                    <Typography><strong>Type:</strong> {selectedAgent.type}</Typography>
                    <Typography><strong>Status:</strong> {selectedAgent.status}</Typography>
                    <Typography><strong>Beslutninger:</strong> {selectedAgent.performance?.decisions || 0}</Typography>
                    <Typography><strong>Successrate:</strong> {((selectedAgent.performance?.successRate || 0) * 100).toFixed(1)}%</Typography>
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Typography>Performance metrics vil blive vist her...</Typography>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Typography>Agent konfiguration vil blive vist her...</Typography>
              </TabPanel>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AIAgents;
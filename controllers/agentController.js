// controllers/agentController.js
const { Agent, agents } = require('../models/Agent');
const { AGENT_STATUS, VALID_STATUS_TRANSITIONS, API_MESSAGES } = require('../utils/constants');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const agentController = {
  // GET /api/agents/:id
  getAgentById: (req, res) => {
    try {
      const { id } = req.params;
      const agent = agents.get(id);
      if (!agent) return sendError(res, API_MESSAGES.AGENT_NOT_FOUND, 404);
      return sendSuccess(res, 'Agent retrieved successfully', agent.toJSON());
    } catch (error) {
      console.error('Error in getAgentById:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500);
    }
  },

  // GET /api/agents
  getAllAgents: (req, res) => {
    try {
      const { status, department } = req.query;
      let agentList = Array.from(agents.values());
      if (status) agentList = agentList.filter(a => a.status === status);
      if (department) agentList = agentList.filter(a => a.department === department);
      return sendSuccess(res, 'Agents retrieved successfully', agentList.map(a => a.toJSON()));
    } catch (error) {
      console.error('Error in getAllAgents:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500);
    }
  },

  // POST /api/agents
  createAgent: (req, res) => {
    try {
      const agentData = req.body;

      // 1. Check duplicate agentCode
      const existingAgent = Array.from(agents.values())
        .find(agent => agent.agentCode === agentData.agentCode);
      if (existingAgent) return sendError(res, `Agent code ${agentData.agentCode} already exists`, 409);

      // 2. Create new agent
      const newAgent = new Agent(agentData);

      // 3. Save to Map
      agents.set(newAgent.id, newAgent);

      // 4. Success response (201)
      return sendSuccess(res, API_MESSAGES.AGENT_CREATED, newAgent.toJSON(), 201);
    } catch (error) {
      console.error('Error in createAgent:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500);
    }
  },

  // PUT /api/agents/:id
  updateAgent: (req, res) => {
    try {
      const { id } = req.params;
      const agent = agents.get(id);
      if (!agent) return sendError(res, API_MESSAGES.AGENT_NOT_FOUND, 404);

      const { name, email, department, skills } = req.body;
      if (name) agent.name = name;
      if (email) agent.email = email;
      if (department) agent.department = department;
      if (skills) agent.skills = skills;
      agent.updatedAt = new Date();

      return sendSuccess(res, API_MESSAGES.AGENT_UPDATED, agent.toJSON());
    } catch (error) {
      console.error('Error in updateAgent:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500);
    }
  },

  // PATCH /api/agents/:id/status
  updateAgentStatus: (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      // 1. Find agent
      const agent = agents.get(id);
      if (!agent) return sendError(res, API_MESSAGES.AGENT_NOT_FOUND, 404);

      // 2. Validate status value
      if (!Object.values(AGENT_STATUS).includes(status)) {
        return sendError(
          res,
          `Invalid status. Valid: ${Object.values(AGENT_STATUS).join(', ')}`,
          400
        );
      }

      // 3. Validate transition
      const validTransitions = VALID_STATUS_TRANSITIONS[agent.status] || [];
      if (!validTransitions.includes(status)) {
        return sendError(
          res,
          `Cannot change from ${agent.status} to ${status}. Valid: ${validTransitions.join(', ')}`,
          400
        );
      }

      // 4. Update status
      agent.updateStatus(status, reason);

      // 5. Success response
      return sendSuccess(res, API_MESSAGES.AGENT_STATUS_UPDATED, agent.toJSON());
    } catch (error) {
      console.error('Error in updateAgentStatus:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500);
    }
  },

  // DELETE /api/agents/:id
  deleteAgent: (req, res) => {
    try {
      const { id } = req.params;
      const agent = agents.get(id);
      if (!agent) return sendError(res, API_MESSAGES.AGENT_NOT_FOUND, 404);
      agents.delete(id);
      return sendSuccess(res, API_MESSAGES.AGENT_DELETED);
    } catch (error) {
      console.error('Error in deleteAgent:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500);
    }
  },

  // GET /api/agents/status/summary
  getStatusSummary: (req, res) => {
    try {
      const agentList = Array.from(agents.values());
      const totalAgents = agentList.length;

      const statusCounts = {};
      Object.values(AGENT_STATUS).forEach(s => {
        statusCounts[s] = agentList.filter(a => a.status === s).length;
      });

      const statusPercentages = {};
      Object.entries(statusCounts).forEach(([s, count]) => {
        statusPercentages[s] = totalAgents > 0 ? Math.round((count / totalAgents) * 100) : 0;
      });

      const summary = {
        totalAgents,
        statusCounts,
        statusPercentages,
        lastUpdated: new Date().toISOString()
      };

      return sendSuccess(res, 'Status summary retrieved successfully', summary);
    } catch (error) {
      console.error('Error in getStatusSummary:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500);
    }
  }
};

module.exports = agentController;
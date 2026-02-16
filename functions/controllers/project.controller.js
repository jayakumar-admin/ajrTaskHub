const projectService = require('../services/project.service');

const getProjects = async (req, res) => {
    try {
        const projects = await projectService.getProjectsForUser(req.user.id);
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getProjectById = async (req, res) => {
    try {
        const project = await projectService.getProjectById(req.params.id, req.user.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found or you do not have access.' });
        }
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createProject = async (req, res) => {
    try {
        const project = await projectService.createProject(req.body, req.user.id);
        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateProject = async (req, res) => {
    try {
        const updatedProject = await projectService.updateProject(req.params.id, req.body, req.user.id);
        res.json(updatedProject);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const deleteProject = async (req, res) => {
    try {
        await projectService.deleteProject(req.params.id, req.user.id);
        res.status(204).send();
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

module.exports = {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
};

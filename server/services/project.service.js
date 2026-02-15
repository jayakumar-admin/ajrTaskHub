const projectQueries = require('../queries/project.queries');
const userQueries = require('../queries/user.queries');

const getProjectsForUser = async (userId) => {
    return await projectQueries.getProjectsForUser(userId);
};

const getProjectById = async (projectId, userId) => {
    const project = await projectQueries.findProjectById(projectId);
    const members = await projectQueries.getProjectMembers(projectId);
    if (project && members.includes(userId)) {
        return project;
    }
    return null; // Or throw an error
};

const createProject = async (projectData, creatorId) => {
    const { memberIds, ...restOfData } = projectData;
    const finalMemberIds = Array.from(new Set([...(memberIds || []), creatorId]));

    const newProject = await projectQueries.createProject(restOfData, creatorId);
    await projectQueries.addProjectMembers(newProject.id, finalMemberIds);

    const users = await userQueries.getAllUsers();
    const creator = users.find(u => u.id === creatorId);
    
    return { 
        ...newProject, 
        member_ids: finalMemberIds, 
        created_by_username: creator?.username 
    };
};

const updateProject = async (projectId, projectData, userId) => {
    const project = await projectQueries.findProjectById(projectId);
    if (!project) {
        const error = new Error('Project not found');
        error.statusCode = 404;
        throw error;
    }
    // Basic permission check
    // A more robust check might involve checking roles (e.g., admin)
    if (project.created_by !== userId) {
        const error = new Error('Only the project creator can edit the project');
        error.statusCode = 403;
        throw error;
    }

    const { memberIds, ...restOfData } = projectData;
    const creatorId = project.created_by;
    const finalMemberIds = Array.from(new Set([...(memberIds || []), creatorId]));

    await projectQueries.removeProjectMembers(projectId);
    await projectQueries.addProjectMembers(projectId, finalMemberIds);
    const updatedProject = await projectQueries.updateProject(projectId, restOfData);

    return { ...updatedProject, member_ids: finalMemberIds };
};

const deleteProject = async (projectId, userId) => {
    const project = await projectQueries.findProjectById(projectId);
    if (!project) {
        const error = new Error('Project not found');
        error.statusCode = 404;
        throw error;
    }
    if (project.created_by !== userId) {
         const error = new Error('Only the project creator can delete the project');
        error.statusCode = 403;
        throw error;
    }
    await projectQueries.deleteProjectById(projectId);
};


module.exports = {
    getProjectsForUser,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
};

import { useState, useEffect } from "react";
import { Modal, Table, Spinner } from "react-bootstrap";
import { Project, ProjectMaterial, Subproject } from "../types";
import supabaseClient from "../utils/supabaseClient";

interface ProjectReportProps {
  show: boolean;
  onHide: () => void;
  projects: Project[];
}

function ProjectReport({
  show,
  onHide,
  projects,
}: ProjectReportProps): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<Record<string, ProjectMaterial[]>>(
    {}
  );
  const [subprojects, setSubprojects] = useState<Record<string, Subproject[]>>(
    {}
  );
  const currentDate = new Date().toLocaleString();

  useEffect(() => {
    let isMounted = true;

    async function fetchReportData() {
      if (!show || !projects.length) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const projectIds = projects.map((p) => p.id);

        const [materialsResponse, subprojectsResponse] = await Promise.all([
          supabaseClient
            .from("project_materials")
            .select("*")
            .in("project_id", projectIds),
          supabaseClient
            .from("subprojects")
            .select("*")
            .in("project_id", projectIds),
        ]);

        if (!isMounted) return;

        if (materialsResponse.error) throw materialsResponse.error;
        if (subprojectsResponse.error) throw subprojectsResponse.error;

        const materialsByProject = materialsResponse.data.reduce(
          (acc, material) => {
            const projectId = material.project_id;
            if (!acc[projectId]) acc[projectId] = [];
            acc[projectId].push(material);
            return acc;
          },
          {} as Record<string, ProjectMaterial[]>
        );

        const subprojectsByProject = subprojectsResponse.data.reduce(
          (acc, subproject) => {
            if (!acc[subproject.project_id]) acc[subproject.project_id] = [];
            acc[subproject.project_id].push(subproject);
            return acc;
          },
          {} as Record<string, Subproject[]>
        );

        setMaterials(materialsByProject);
        setSubprojects(subprojectsByProject);
      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchReportData();

    return () => {
      isMounted = false;
    };
  }, [show, projects]);

  function calculateProjectCost(projectId: string): number {
    const projectMaterials = materials[projectId] || [];
    return projectMaterials.reduce(
      (sum, material) => sum + (material.quantity_needed || 0),
      0
    );
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" className="report-modal">
      <Modal.Header closeButton>
        <Modal.Title>Projects Report</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center p-4">
            <Spinner animation="border" />
            <p className="mt-2">Loading report data...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-4">
              <h2>Project Pantry - Project Report</h2>
              <p>Generated on: {currentDate}</p>
            </div>

            <Table responsive striped bordered>
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Creation Date</th>
                  <th>Last Updated</th>
                  <th>Estimated Time (hrs)</th>
                  <th>Total Cost ($)</th>
                  <th>Subprojects</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td>{project.name}</td>
                    <td>{new Date(project.created_at).toLocaleDateString()}</td>
                    <td>{new Date(project.updated_at).toLocaleDateString()}</td>
                    <td>{project.estimated_time || 0}</td>
                    <td>${calculateProjectCost(project.id).toFixed(2)}</td>
                    <td>{(subprojects[project.id] || []).length}</td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <div className="mt-4">
              <h4>Summary</h4>
              <Table responsive bordered size="sm">
                <tbody>
                  <tr>
                    <td>Total Projects:</td>
                    <td>{projects.length}</td>
                  </tr>
                  <tr>
                    <td>Total Estimated Time:</td>
                    <td>
                      {projects.reduce(
                        (sum, project) => sum + (project.estimated_time || 0),
                        0
                      )}{" "}
                      hours
                    </td>
                  </tr>
                  <tr>
                    <td>Total Cost:</td>
                    <td>
                      $
                      {projects
                        .reduce(
                          (sum, project) =>
                            sum + calculateProjectCost(project.id),
                          0
                        )
                        .toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer></Modal.Footer>
    </Modal>
  );
}

export default ProjectReport;

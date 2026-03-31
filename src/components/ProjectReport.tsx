import { useState, useEffect } from "react";
import { Modal, Table, Spinner, Alert } from "react-bootstrap";
import { Project, Subproject } from "../types";
import {
  fetchProjectReportData,
  ReportMaterial,
} from "../data-access/reports.data";

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
  const [materials, setMaterials] = useState<Record<string, ReportMaterial[]>>(
    {}
  );
  const [subprojects, setSubprojects] = useState<Record<string, Subproject[]>>(
    {}
  );
  const [reportError, setReportError] = useState<string | null>(null);
  const currentDate = new Date().toLocaleString();

  useEffect(() => {
    let isMounted = true;

    async function fetchReportData() {
      if (!show || !projects.length) {
        setMaterials({});
        setSubprojects({});
        setReportError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setReportError(null);
      try {
        const projectIds = projects.map((p) => p.id);
        const reportData = await fetchProjectReportData(projectIds);

        if (!isMounted) return;

        const subprojectProjectIdMap = reportData.subprojects.reduce(
          (acc, subproject) => {
            acc[subproject.id] = subproject.project_id;
            return acc;
          },
          {} as Record<string, string>
        );

        const materialsByProject = reportData.materials.reduce(
          (acc, material) => {
            const projectId =
              material.project_id ||
              (material.subproject_id
                ? subprojectProjectIdMap[material.subproject_id]
                : null);
            if (!projectId) {
              return acc;
            }
            if (!acc[projectId]) acc[projectId] = [];
            acc[projectId].push(material);
            return acc;
          },
          {} as Record<string, ReportMaterial[]>
        );

        const subprojectsByProject = reportData.subprojects.reduce(
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
        setReportError(
          error instanceof Error
            ? error.message
            : "Failed to load report data."
        );
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
      (sum, material) =>
        sum +
        (material.quantity_needed || 0) * (material.inventory_items?.unit_cost || 0),
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
        ) : reportError ? (
          <Alert variant="danger" className="mb-0">
            {reportError}
          </Alert>
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

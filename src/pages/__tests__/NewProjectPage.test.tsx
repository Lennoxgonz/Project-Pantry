import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NewProjectPage from '../NewProjectPage';

// Test 1: Test page rendering
describe('Test 1: Page Rendering', () => {
  it('verifies the page renders with correct title and initial state', () => {
    render(
      <BrowserRouter>
        <NewProjectPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Create New Project')).toBeInTheDocument();
  });
});

// Test 2: Test project material addition
describe('Test 2: Project Material Addition', () => {
  it('verifies materials can be added to the main project', () => {
    render(
      <BrowserRouter>
        <NewProjectPage />
      </BrowserRouter>
    );
    
    const addMaterialButton = screen.getByRole('button', { name: /add material/i });
    fireEvent.click(addMaterialButton);
    
    expect(screen.getByText('Material 1')).toBeInTheDocument();
  });
});

// Test 3: Test subproject creation
describe('Test 3: Subproject Material Addition', () => {
  it('verifies materials can be added to a subproject', () => {
    render(
      <BrowserRouter>
        <NewProjectPage />
      </BrowserRouter>
    );
    
    const addSubprojectButton = screen.getByRole('button', { name: /add subproject/i });
    fireEvent.click(addSubprojectButton);
    expect(screen.getByText('Subproject 1')).toBeInTheDocument();
    
    const buttons = screen.getAllByRole('button', { name: /add material/i });
    const subprojectAddMaterialButton = buttons[1];
    fireEvent.click(subprojectAddMaterialButton);
    
    const materialHeaders = screen.getAllByText(/material 1/i);
    expect(materialHeaders.length).toBeGreaterThan(0);
  });
});
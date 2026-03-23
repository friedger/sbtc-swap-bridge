import { Navigate } from 'react-router-dom';

// Manage page merged into Custodian page
export default function Manage() {
  return <Navigate to="/custodian" replace />;
}

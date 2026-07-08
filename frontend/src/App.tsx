import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { GroupsPage } from './pages/GroupsPage';
import { HistoryDetailPage } from './pages/HistoryDetailPage';
import { HistoryPage } from './pages/HistoryPage';
import { NewTicketPage } from './pages/NewTicketPage';
import { ParticipantsPage } from './pages/ParticipantsPage';
import { TicketDetailPage } from './pages/TicketDetailPage';
import { TicketsPage } from './pages/TicketsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/tickets" replace />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="tickets/new" element={<NewTicketPage />} />
        <Route path="tickets/:id" element={<TicketDetailPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="history/:id" element={<HistoryDetailPage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="gestion-de-group" element={<GroupsPage />} />
        <Route path="participants" element={<ParticipantsPage />} />
        <Route path="gestion-de-participant" element={<ParticipantsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/tickets" replace />} />
    </Routes>
  );
}

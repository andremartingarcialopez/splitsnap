import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { GroupsPage } from './pages/GroupsPage';
import { HistoryDetailPage } from './pages/HistoryDetailPage';
import { HistoryPage } from './pages/HistoryPage';
import { HomePage } from './pages/HomePage';
import { NewTicketPage } from './pages/NewTicketPage';
import { ParticipantsPage } from './pages/ParticipantsPage';
import { TicketControlPage } from './pages/TicketControlPage';
import { TicketDetailPage } from './pages/TicketDetailPage';
import { TicketReviewPage } from './pages/TicketReviewPage';
import { TicketSharePage } from './pages/TicketSharePage';
import { TicketsPage } from './pages/TicketsPage';
import { PublicTicketPage } from './pages/PublicTicketPage';

export default function App() {
  return (
    <Routes>
      <Route path="ticket/:shareCode" element={<PublicTicketPage />} />
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="scan" element={<NewTicketPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="tickets/new" element={<Navigate to="/scan" replace />} />
        <Route path="tickets/:id/review" element={<TicketReviewPage />} />
        <Route path="tickets/:id/share" element={<TicketSharePage />} />
        <Route path="tickets/:id/control" element={<TicketControlPage />} />
        <Route path="tickets/:id" element={<TicketDetailPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="history/:id" element={<HistoryDetailPage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="gestion-de-group" element={<GroupsPage />} />
        <Route path="participants" element={<ParticipantsPage />} />
        <Route path="gestion-de-participant" element={<ParticipantsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

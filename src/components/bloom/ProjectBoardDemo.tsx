import { useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ProjectBoard, type ProjectColumn, type ProjectMember } from '@oxy.so/bloom/project-board';
import { useTranslation } from '../../lib/i18n';

const members: Record<string, ProjectMember> = {
  maya: { id: 'maya', name: 'Maya Collins', initials: 'MC' },
  alex: { id: 'alex', name: 'Alex Rivera', initials: 'AR' },
  sam: { id: 'sam', name: 'Sam Morgan', initials: 'SM' },
};

/** Product data stays here; ticket interactions and panels belong to Bloom. */
export default function ProjectBoardDemo() {
  const { t } = useTranslation();
  const columns = useMemo<ProjectColumn[]>(() => {
    const columnKeys = ['backlog', 'todo', 'inProgress', 'inReview', 'done'] as const;
    const tickets = [
      ['attachments', 'search', 'limits'],
      ['loader', 'thinking'],
      ['table', 'calendar'],
      ['auth', 'meeting'],
      [],
    ];
    return columnKeys.map((key, column) => ({
      id: key,
      title: t(`bloom.board.${key}`),
      limit: [8, 5, 4, 3, 8][column],
      tickets: tickets[column].map((name, index) => ({
        id: `bloom-${name}`,
        code: `BL-${column * 10 + index + 1}`,
        area: 'Bloom UI',
        title: t(`bloom.cards.${name}.title`),
        description: t(`bloom.cards.${name}.description`),
        since: '',
        priority: (['Low', 'Medium', 'High'] as const)[(column + index) % 3],
        project: 'Bloom',
        assignees: index % 2 ? ['alex'] : ['maya', 'sam'],
        createdBy: 'maya',
        comments: [
          {
            id: `comment-${name}`,
            author: 'Alex Rivera',
            body: t('bloom.demoReply'),
            time: '',
          },
        ],
        resources: [
          {
            label: 'Bloom UI',
            href: 'https://oxy.so/developers/docs/bloom/components/',
          },
        ],
        tokenUsage: {
          data: Array.from({ length: 16 }, (_, day) => ({
            label: String(day + 1),
            value: 2400 + ((day * 719) % 4200),
          })),
          headline: 68000,
          delta: '+14.8%',
          startLabel: '1',
          endLabel: '16',
        },
      })),
    }));
  }, [t]);
  return (
    <GestureHandlerRootView style={{ flex: 1, minHeight: 0, width: '100%', height: '100%' }}>
      <ProjectBoard
        title={t('bloom.projects')}
        teamName="Bloom"
        ownerName="Maya Collins"
        initialColumns={columns}
        members={members}
        projects={['Bloom', 'Oxy']}
        currentUserId="maya"
        style={{ height: '100%', minHeight: 600 }}
      />
    </GestureHandlerRootView>
  );
}

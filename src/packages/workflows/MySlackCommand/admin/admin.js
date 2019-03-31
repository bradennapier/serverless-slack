/* @flow */
import type { Bot$Workflow$Segment } from 'types/bot/workflows';

import events from './components/events';
import commands from './components/commands';
import effects from './components/effects';
import validators from './components/validators';

const AdminControls: Bot$Workflow$Segment = {
  meta: {
    title: 'MySlackCommand Admin Controls',
    path: 'admin',
    hint: 'For Administration of the Bot and permissions system.',
  },
  components: {
    commands,
    events,
    effects,
    validators,
  },
};

export default AdminControls;

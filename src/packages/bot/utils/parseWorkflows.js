/* @flow */
import type { Bot$Interface, Bot$Workflows, Bot$Workflow$Segment } from 'types/bot';

type Bot$ParsedSegment = {
  id: string,
  meta: $PropertyType<Bot$Workflow$Segment, 'meta'>,
  path: string[],
  subcommands?: string[],
  components?: any,
  children?: any,
};

type Bot$ParsedEffect = {
  id: string,
  path: string[],
  execute: Function,
};

/*
  The goal while parsing the workflows format is to
  switch it into a simple and flat format based on
  the environment so that we can easily capture
  the required functionality based on the way we
  receive the data from the Slack API.

  We essentially boil the workflows down to both a
  parsed standard tree:

  {
    id: '',
    path: ['', ''],
    meta: {},
    components: {},
    children: {}
  }

  as well as a set of maps which are the path joined
  by a "." as the key

  "Command.blacklist.add" => { ...DescriptorType }
*/

function parseSegmentComponents(
  bot,
  segment,
  parsed,
  commandMap,
  effectMap,
  eventMap,
  validatorMap,
) {
  const components = {};
  if (segment.components) {
    const { components: segmentComponents } = segment;
    Object.keys(segmentComponents).forEach(componentID => {
      let result;
      switch (componentID) {
        case 'dialogs':
        case 'messages': {
          break;
        }
        case 'events': {
          const component = segmentComponents[componentID];
          if (!component) return;
          result = parseEvents(component, segment, parsed, eventMap);
          break;
        }
        case 'effects': {
          const component = segmentComponents[componentID];
          if (!component) return;
          result = parseEffects(component, segment, parsed, effectMap);
          break;
        }
        case 'commands': {
          const component = segmentComponents[componentID];
          if (!component) return;
          result = parseCommands(component, segment, parsed, commandMap);
          break;
        }
        case 'validators': {
          const component = segmentComponents[componentID];
          if (!component) return;
          result = parseValidators(component, segment, parsed, validatorMap);
          break;
        }
        default: {
          throw new Error(
            `An Unknown Component was discovered while parsing bot workflows: ${componentID} at ${parsed.path.join(
              '.',
            )}`,
          );
        }
      }
      if (result) {
        components[componentID] = result;
      }
    });
  }
  return components;
}

function parseCommands(component, segment, parsed, map) {
  const commandsMap = new Map();
  Object.keys(component).forEach(commandID => {
    const commandPath = [...parsed.path, commandID];
    const command = component[commandID];
    const parsedCommand = {
      ...command,
      id: commandID,
      path: commandPath,
    };
    commandsMap.set(commandID, parsedCommand);
    map.set(commandPath.join('.'), parsedCommand);
  });
  return commandsMap;
}

function parseEffects(component, segment, parsed, map) {
  const effectsMap = new Map();
  Object.keys(component).forEach(effectID => {
    const effectPath = [...parsed.path, effectID];
    const effect = component[effectID];
    const parsedEffect = {
      id: effectID,
      path: effectPath,
      execute: effect,
    };
    effectsMap.set(effectID, parsedEffect);
    map.set(effectPath.join('.'), parsedEffect);
  });
  return effectsMap;
}

function parseEvents(component, segment, parsed, map) {
  const eventsMap = new Map();
  Object.keys(component).forEach(eventID => {
    const eventPath = [...parsed.path, eventID];
    const event = component[eventID];
    const parsedEvent = {
      id: eventID,
      path: eventPath,
      execute: event,
    };
    eventsMap.set(eventID, parsedEvent);
    map.set(eventPath.join('.'), parsedEvent);
  });
  return eventsMap;
}

function parseValidators(component, segment, parsed, map) {
  const eventsMap = new Map();
  Object.keys(component).forEach(eventID => {
    const eventPath = [...parsed.path, eventID];
    const validator = component[eventID];
    const parsedEvent = {
      id: eventID,
      path: eventPath,
      execute: validator,
    };
    eventsMap.set(eventID, parsedEvent);
    map.set(eventPath.join('.'), parsedEvent);
  });
  return eventsMap;
}

function parseChildren(
  bot: Bot$Interface,
  children: Bot$Workflows,
  path: Array<string>,
  commandMap: Map<string, Bot$ParsedSegment>,
  effectMap: Map<string, Bot$ParsedEffect>,
  eventMap: Map<string, any>,
  validatorMap: Map<string, Bot$ParsedEffect>,
) {
  return Object.keys(children).reduce((parsed, childID) => {
    const segment = children[childID];

    if (typeof segment !== 'object') {
      return parsed;
    }

    if (!segment.meta) {
      throw new Error(
        `[ERROR] | [BOT] | Failed to parse workflow segment, meta property not found at ${path.join(
          ' ',
        )} > ${childID}`,
      );
    }

    const segmentID = segment.meta.path || childID;
    const segmentPath = [...path, segmentID];

    const parsedSegment: Bot$ParsedSegment = {
      id: segmentID,
      path: segmentPath,
      meta: segment.meta,
    };

    commandMap.set(segmentPath.join('.'), parsedSegment);

    if (segment.children) {
      parsedSegment.children = parseChildren(
        bot,
        segment.children,
        segmentPath,
        commandMap,
        effectMap,
        eventMap,
        validatorMap,
      );
    }

    parsedSegment.components = parseSegmentComponents(
      bot,
      segment,
      parsedSegment,
      commandMap,
      effectMap,
      eventMap,
      validatorMap,
    );

    if (parsedSegment.children || (parsedSegment.components && parsedSegment.components.commands)) {
      const subcommands = [];
      if (parsedSegment.children) {
        subcommands.push(...Object.keys(parsedSegment.children));
      }
      if (parsedSegment.components && parsedSegment.components.commands) {
        subcommands.push(...[...parsedSegment.components.commands.keys()]);
      }
      if (subcommands.length > 0) {
        parsedSegment.subcommands = subcommands;
      }
    }

    parsed[segmentID] = parsedSegment;
    return parsed;
  }, {});
}
/**
 * Receives the SlackBot Workflows and parses through it, building
 * any necessary context to help us while processing execution of
 * the given workflow.
 */
export function parseWorkflows(bot: Bot$Interface, workflows: Bot$Workflows) {
  const rootPath = [];
  const rootCommandHashMap: Map<string, Bot$ParsedSegment> = new Map();
  const rootEffectHashMap: Map<string, Bot$ParsedEffect> = new Map();
  const rootEventHashMap: Map<string, any> = new Map();
  const rootValidatorsHashMap: Map<string, Bot$ParsedEffect> = new Map();
  const children = parseChildren(
    bot,
    workflows,
    rootPath,
    rootCommandHashMap,
    rootEffectHashMap,
    rootEventHashMap,
    rootValidatorsHashMap,
  );
  return {
    commands: rootCommandHashMap,
    effects: rootEffectHashMap,
    events: rootEventHashMap,
    validators: rootValidatorsHashMap,
    children,
  };
}

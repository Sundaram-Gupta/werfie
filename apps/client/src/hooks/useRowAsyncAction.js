import React from 'react';

export function useRowAsyncAction() {
    const [activeAction, setActiveAction] = React.useState(null);

    const toKey = React.useCallback((actionName, entityId) => `${actionName}:${entityId}`, []);

    const isActive = React.useCallback(
        (actionKey) => activeAction === actionKey,
        [activeAction]
    );

    const runAction = React.useCallback(async (actionKey, task) => {
        setActiveAction(actionKey);
        try {
            return await task();
        } finally {
            setActiveAction(null);
        }
    }, []);

    const runFor = React.useCallback((actionName, entityId, task) => {
        return runAction(toKey(actionName, entityId), task);
    }, [runAction, toKey]);

    const isActiveFor = React.useCallback((actionName, entityId) => {
        return isActive(toKey(actionName, entityId));
    }, [isActive, toKey]);

    const bindEntity = React.useCallback((entityId) => ({
        key: (actionName) => toKey(actionName, entityId),
        isActive: (actionName) => isActiveFor(actionName, entityId),
        run: (actionName, task) => runFor(actionName, entityId, task)
    }), [isActiveFor, runFor, toKey]);

    return {
        activeAction,
        toKey,
        isActive,
        runAction,
        isActiveFor,
        runFor,
        bindEntity
    };
}


import { useEffect, useRef } from 'react'
import { useLogStore } from '../store/logStore'
import { logsAPI } from '../services/logsAPI'

// Background sync service - runs every 30 seconds
export const useLogSync = () => {
    const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const { getUnsyncedLogs, markLogsAsSynced, incrementSyncAttempts, setSyncing, isSyncing } = useLogStore()

    useEffect(() => {
        const syncLogs = async () => {
            if (isSyncing) return // Already syncing

            const unsyncedLogs = getUnsyncedLogs()

            // Only sync if there are unsynced logs
            if (unsyncedLogs.length === 0) return

            // Filter out logs that have failed too many times (max 5 attempts)
            const logsToSync = unsyncedLogs.filter(log => (log.syncAttempts || 0) < 5)

            if (logsToSync.length === 0) return

            console.log(`[LOG_SYNC] Syncing ${logsToSync.length} logs to server...`)
            setSyncing(true)

            try {
                const result = await logsAPI.sendLogs(logsToSync)

                if (result.success) {
                    markLogsAsSynced(result.syncedIds)
                    console.log(`[LOG_SYNC] Successfully synced ${result.syncedIds.length} logs`)
                } else {
                    // Increment sync attempts for failed logs
                    incrementSyncAttempts(logsToSync.map(l => l.id))
                    console.warn('[LOG_SYNC] Failed to sync logs, will retry later')
                }
            } catch (error) {
                console.error('[LOG_SYNC] Sync error:', error)
                incrementSyncAttempts(logsToSync.map(l => l.id))
            } finally {
                setSyncing(false)
            }
        }

        // Initial sync after 5 seconds
        const initialTimeout = setTimeout(syncLogs, 5000)

        // Then sync every 30 seconds
        syncIntervalRef.current = setInterval(syncLogs, 30000)

        return () => {
            clearTimeout(initialTimeout)
            if (syncIntervalRef.current) {
                clearInterval(syncIntervalRef.current)
            }
        }
    }, [getUnsyncedLogs, markLogsAsSynced, incrementSyncAttempts, setSyncing, isSyncing])

    // Manual sync function
    const manualSync = async () => {
        const unsyncedLogs = getUnsyncedLogs()
        if (unsyncedLogs.length === 0) {
            console.log('[LOG_SYNC] No logs to sync')
            return { success: true, count: 0 }
        }

        setSyncing(true)
        try {
            const result = await logsAPI.sendLogs(unsyncedLogs)
            if (result.success) {
                markLogsAsSynced(result.syncedIds)
            }
            return { success: result.success, count: result.syncedIds.length }
        } catch (error) {
            console.error('[LOG_SYNC] Manual sync error:', error)
            return { success: false, count: 0 }
        } finally {
            setSyncing(false)
        }
    }

    return { manualSync }
}

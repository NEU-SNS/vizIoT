import { useEffect} from 'react';
import { customTimer, clearCustomTimer, startCustomTimer } from 'VizIoT/utility/CustomTimer';

export const useCustomTimer = (callback, delay) => {
    useEffect(() => {
        startCustomTimer(callback)
        customTimer(callback, delay)
        return () => {
            clearCustomTimer(callback)
        }
    }, [])
}
import colors from './colors';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.primary,
        color: colors.white,
        // ...
    },
    statusSuccess: {
        color: colors.success,
    },
    statusError: {
        color: colors.error,
    },
    // ...
}); 
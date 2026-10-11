import React, { PropsWithChildren } from 'react';
import AuthLayout from './AuthLayout';

export default function Guest({ children }: PropsWithChildren) {
    return <AuthLayout>{children}</AuthLayout>;
}

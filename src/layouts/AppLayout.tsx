//---------------------------------------------------------------------------------------------------------------------------

import type { Location } from "react-router-dom";

import { Link, Outlet } from "react-router-dom";
import { LogoutButton } from '../components/LogoutButton';
import { useLocation } from "react-router-dom";
import { IconATSA } from "../Icons/IconATSA";
import { Subheader } from "../components/Subheader";

//---------------------------------------------------------------------------------------------------------------------------

const AppLayout = (): React.JSX.Element => {

    const location: Location = useLocation();

    return (
        <div style={{ minHeight: '100dvh', background: 'linear-gradient(rgb(255, 255, 255) 0%, rgb(234, 234, 234) 100%)' }}>
            <header style={{
                padding: '1rem',
                backgroundColor: '#ffffffff',
                boxShadow: `
                0 4px 6px -2px rgba(0, 0, 0, 0.1),
                0 4px 6px -2px rgba(0, 0, 0, 0.1),
                0 8px 12px -4px rgba(0, 0, 0, 0.1),
                0 2px 2px -6px rgba(0, 0, 0, 0.06)
                `,
                borderRadius: '0 0 1rem 1rem',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 auto', backgroundColor: 'transparent', position: 'relative' }}>

                    {location.pathname !== '/' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Link
                                to="/"
                                style={{
                                    color: '#34C2FC',
                                    fontSize: '2rem',
                                    textDecoration: 'none',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.2rem',
                                }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="32"
                                    height="32"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="icon icon-tabler icons-tabler-outline icon-tabler-arrow-narrow-left"
                                >
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path d="M5 12l14 0" />
                                    <path d="M5 12l4 4" />
                                    <path d="M5 12l4 -4" />
                                </svg>
                                Volver
                            </Link>

                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#0a7fc1', fontWeight: 'bold', fontSize: '1.5rem', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>

                        <IconATSA style={{ height: '3rem' }} />
                        <p>Hurlingham</p>
                    </div>

                    {location.pathname === '/' ? (
                        <div style={{ marginLeft: 'auto', paddingRight: '2rem' }}>
                            <LogoutButton />
                        </div>
                    ) : (
                        <Subheader />
                    )}
                </div>
            </header >

            <section style={{ padding: '1rem 1rem 0 1rem' }}>
                <Outlet />
            </section>
        </div >
    );
};

export { AppLayout };
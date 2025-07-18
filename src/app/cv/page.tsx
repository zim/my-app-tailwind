'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register the ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default function CVPage() {
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [isProfileExpanded, setIsProfileExpanded] = useState(false);

    // Refs for GSAP animations
    const headerRef = useRef<HTMLDivElement>(null);
    const sectionsRef = useRef<HTMLDivElement>(null);
    const skillsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Header animation
        if (headerRef.current) {
            gsap.fromTo(headerRef.current,
                { opacity: 0, y: -30 },
                { opacity: 1, y: 0, duration: 1, ease: "power2.out" }
            );
        }

        // Sections stagger animation
        if (sectionsRef.current) {
            const sections = sectionsRef.current.querySelectorAll('.cv-section');
            gsap.fromTo(sections,
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    stagger: 0.15,
                    ease: "power2.out",
                    delay: 0.3
                }
            );
        }

        // Skills animation with ScrollTrigger
        if (skillsRef.current) {
            const skillItems = skillsRef.current.querySelectorAll('.skill-item');
            skillItems.forEach((item, index) => {
                gsap.fromTo(item,
                    { opacity: 0, scale: 0.8 },
                    {
                        opacity: 1,
                        scale: 1,
                        duration: 0.5,
                        ease: "back.out(1.7)",
                        scrollTrigger: {
                            trigger: item,
                            start: "top 85%",
                            end: "bottom 15%",
                            toggleActions: "play none none reverse"
                        },
                        delay: index * 0.1
                    }
                );
            });
        }

        // Experience items animation
        const expItems = document.querySelectorAll('.experience-item');
        expItems.forEach((item, index) => {
            gsap.fromTo(item,
                { opacity: 0, x: index % 2 === 0 ? -50 : 50 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.8,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: item,
                        start: "top 80%",
                        end: "bottom 20%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        });

        // Cleanup function
        return () => {
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
    }, []);

    const toggleSection = (sectionId: string) => {
        setActiveSection(prev => {
            const newState = prev === sectionId ? null : sectionId;

            // Animate the toggle
            const sectionElement = document.getElementById(`section-${sectionId}`);
            if (sectionElement) {
                const details = sectionElement.querySelector('.section-details');
                if (details) {
                    if (newState === sectionId) {
                        gsap.fromTo(details,
                            { opacity: 0, height: 0 },
                            { opacity: 1, height: "auto", duration: 0.5, ease: "power2.out" }
                        );
                    } else {
                        gsap.to(details,
                            { opacity: 0, height: 0, duration: 0.3, ease: "power2.in" }
                        );
                    }
                }
            }

            return newState;
        });
    };

    const toggleProfile = () => {
        setIsProfileExpanded(prev => {
            const newState = !prev;

            // Animate the profile expansion
            const profileElement = document.getElementById('profile-content');
            if (profileElement) {
                if (newState) {
                    gsap.fromTo(profileElement,
                        { opacity: 0, height: 0 },
                        { opacity: 1, height: "auto", duration: 0.5, ease: "power2.out" }
                    );
                } else {
                    gsap.to(profileElement,
                        { opacity: 0, height: 0, duration: 0.3, ease: "power2.in" }
                    );
                }
            }

            return newState;
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const personalInfo = {
        name: "Jolyon Zim Segal",
        address: "20 Empire Square, London, N7 6JN",
        phone: "07958 200 055",
        email: "zimsegal@hotmail.com"
    };

    const profileSummary = `I have worked in the digital field for over 25 years, specializing in Front-End Mobile and Web development. My expertise lies in React, TypeScript, and modern web technologies, with experience ranging from early internet development at Ministry of Sound and FHM.com to recent work at Williams Lea on cutting-edge React applications including AI-powered tools and Microsoft Office integrations.

I'm passionate about collaborative development, knowledge sharing, and creating robust digital products in team environments. Currently focused on expanding my React.js ecosystem knowledge while contributing to the ever-evolving development field across all sectors and industries.`;

    const profile = `I have worked in the digital field for over 25 years after leaving university in 1995 passing degrees in Social Science (BA), Development Studies (MA) and Computing (Conversion MSc).

My first job in the then emerging internet field was for Ministryofsound.com, where I spent three years developing and maintaining their innovative website and digital products in its early days. Working in a small team using HTML / JavaScript / ASP / SQL and other technologies to develop for cross browser usability.

The next substantial part of my early career was spent at EMAP developing and maintaining FHM.com - a large, innovative and successful men's lifestyle website and its associated digital products. Again, working in a close knit medium sized team using HTML / CSS / JavaScript / ASP / SQL and other technologies.

Both of these work experiences helped establish my collaborative, knowledge sharing, solution driven approach to digital development, and a belief that this environment is necessary to produce the best and most robust digital products.

The last 15 years have seen me focus largely on the Front-End arena of Mobile and Web development. Continuing to use the many evolving technologies, working in some amazing teams, to produce a variety of cutting-edge products. I continue to enjoy the challenges that are presented with trying to create great robust digital products in collaborative teams. Be they large or small. In the process I am always seeking to further develop my own knowledge and skills and hoping to share knowledge and encourage others to grow.

The last 2 and a half years I have been at Williams Lea initially as a Front End Developer and more recently as an Application Front End Developer.

Over the last 18 months I have been working as Application Front End Developer on many exciting and cutting edge projects. Including Engage MyQueue, Engage LogoCloud and Engage Transcribe. Working within a React, TypeScript ecosystem. Following modern approaches and best practices.

The first 9 months I worked at Williams Lea, within the Web Development department of Creative UK within EY. I was bought on board amongst other things to help the team shift to React based Web sites and applications. I am proud of the work I did and the achievements I made, both personally and for the team and department. Making a positive impact creating the Web Development teams first successful React based products. As well as sharing my knowledge in pro active training for team members.

Before this a had spent 5 months working at Little Emperors, a private members hotel club, offering access to preferred rates and benefits at hotels around the globe, primarily working on their Website and Mobile Application. Working with React.js, React Native, backend API's and many JS libraries and design patterns.

Before this I enjoyed 9 months working at Omni Property Finance Ltd in the finance sector developing an in-house loan management React based web application.

The previous year was working at Pancentric Ltd, a media agency focused in the insurance sector. Producing and maintaining various existing sites and .NET driven CMSs, as well as prototyping a product called Goinsur - A single page React based web application.

The Year before this I worked on what was my first commercial React/Redux project. Developing a sophisticated data driven web app. Utilizing many JavaScript libraries including D3, and gsap, within a React/Redux environment.

I have now been working primarily in Node, React/Redux based environments for over 7 years, in 6 different positions. Getting amazing experiences, all positive in terms of my learning curve within the mobile/web development and JavaScript ecosystem, particularly working with React.js in a Redux environment.

I am very focused on wanting to continue to grow my knowledge and experience with JavaScript and React.js and its surrounding ecosystem of related JavaScript utilities and design ideas. However, I am keen to continue learning, and sharing knowledge, in all areas of Mobile/Web Development.`;

    const workExperience = [
        {
            company: "Williams Lea",
            position: "Front End Developer",
            period: "September 2022 - Present",
            description: "Working on React projects for major clients and internally. Translating Design teams concepts into robust, responsive, interactive web applications using HTML CSS and JavaScript. Working within the React ecosystem using many modern React libraries covering all areas. Also using strict typing with Typescript.",
            projects: [
                "MyQueue: Working with Node.js, JavaScript es6, React.js, Zustand, React Router to create modern update to Engage Request management application",
                "Engage LogoCloud: Working with Node.js, JavaScript es6, React.js, TypeScript, Redux Toolkit, Antd, FluentUI and the React ecosystem to create a MS Office Add In Application. Machine learning ensures all logos are quality and brand checked before inclusion into the LogoCloud database, making thousands of fit-for-purpose logos, available at the push of the button within MS Office desktop application such as PowerPoint, Word and Excel.",
                "Engage Transcribe: Working with Node.js, JavaScript es6, React.js, TypeScript, Redux Toolkit, Antd, FluentUI and the React ecosystem. providing AI-powered transcription React based web application."
            ]
        },
        {
            company: "Little Emperors",
            position: "JavaScript Developer",
            period: "October 2021 - May 2022",
            description: "Working on React projects within a private members hotel club environment.",
            projects: [
                "Little Emperors Website: Working with Node.js, JavaScript es6, React.js, React Native, React Redux, React Router, in a small team developing private members hotel club, with both a web and mobile application-based presence",
                "Little Emperors Mobile Application: Working with Node.js, JavaScript es6, React.js, React Native, Redux, React Router, GIT, GitHub, Unix."
            ]
        },
        {
            company: "Omni Property Finance Limited",
            position: "JavaScript Developer",
            period: "November 2020 - September 2021",
            description: "Working in a small team developing an in-house Loan management application.",
            projects: [
                "Ucreate Loan management application: Working with Node.js, JavaScript es6, React.js, React Redux, React Router, React Final Form, Material UI, Styled Components, TDD, Testing Library, Jest, underscore, GIT, GitHub, Unix."
            ]
        },
        {
            company: "Pancentric, London",
            position: "Senior Front-End Developer",
            period: "June 2019 - August 2020",
            description: "Production and maintenance of various sites and CMSs, as well as prototyping React applications.",
            projects: [
                "GoInsur React App: Node.js, React.js, React Router, Form based single page application.",
                "GRP Group: Production and maintenance of Dot.Net Umbraco CMS. HTML, CSS, SASS, JavaScript, jQuery, Node.js, GIT, Unix.",
                "OCS Group UK: Production and maintenance of Dot.Net Umbraco CMS. HTML, CSS, SASS, JavaScript, jQuery, Node.js, GIT, Unix.",
                "British Friendly: Production and maintenance Advisors form journey and functionality. HTML, CSS, SASS, JavaScript, jQuery, Node.js, GIT, Unix.",
                "The Shard: Production and maintenance The Shard Website. HTML, CSS, SASS, JavaScript, jQuery, Node.js, GIT, Unix.",
                "Marsh Commercial: Production and maintenance Marsh Commercial Dot.Net Sitecore CMS Website. HTML, CSS, SASS, JavaScript, jQuery, Node.js, GIT, Unix."
            ]
        },
        {
            company: "Compelo, London",
            position: "Senior Front End Developer",
            period: "March 2018 - May 2019",
            description: "Working on a React/Redux project. Developing a sophisticated data driven web app. Utilizing D3, and gsap, within a React/Redux environment.",
            projects: [
                "React Dashboard: Node, React.js, React Router, React-pdf, Redux, D3, Greensock gsap. Working Alongside a Doctor of Mathematics and data scientist developed Dashboard data driven web app that is fully responsive and dynamic, utilizing D3 and gsap within react to produce svg graphs on the fly according to date range chosen and other criteria."
            ]
        },
        {
            company: "TAG Worldwide, London",
            position: "Senior Front End Developer",
            period: "May 2013 - September 2017",
            description: "Working on various client projects including HTML5 banner creatives, responsive email systems, and mobile/web applications.",
            projects: [
                "Master HTML5 Banner Creatives: HTML, CSS, JavaScript, jQuery, Greensock",
                "BT Responsive Email/Microsite System: HTML, CSS, JavaScript, jQuery, Email on Acid, Litmus, Mailchimp, GIT, Unix.",
                "AA Mobile/Web Magazine: HTML, CSS, JavaScript, jQuery, video, PHP, GIT, Unix.",
                "CHI Agency Lexus Amazing in Motion Mobile/Web site: HTML, CSS, JavaScript, jQuery, video, PHP, GIT, Unix",
                "Jaguar/Land Rover Drupal Website Maintenance: HTML, CSS, JavaScript, jQuery, PHP/Drupal."
            ]
        },
        {
            company: "EMAP UK FHM, London",
            position: "Web Developer",
            period: "January 2000 - March 2007",
            description: "Producing and maintaining FHM website using HTML, JavaScript, ASP, Enterprise Manager. Project managing site development from beginning to end.",
            projects: [
                "FHM.COM Website: Complete development and maintenance using HTML, JavaScript, ASP, SQL Server",
                "Hand coding of Microsites and Competitions including 100 Sexiest voting mechanism, 100 Greatest Internet Games",
                "Development and maintenance of Content Management System using ASP and Microsoft SQL Server",
                "Construction of FHM.COM email newsletters using HTML and Bluestreak Email system"
            ]
        },
        {
            company: "Ministry of Sound, London",
            position: "Web Developer",
            period: "January 1997 - January 2000",
            description: "Producing and maintaining Ministry of Sound web site using HTML, JavaScript, ASP, Enterprise Manager. Project managing site development from beginning to end.",
            projects: [
                "Ministryofsound.com Website: Complete development and maintenance using HTML, JavaScript, ASP, SQL Server",
                "Development and maintenance of Content Management System using ASP and Microsoft SQL Server",
                "Hand coding of Microsites and Competitions for advertising and marketing departments",
                "Construction of email newsletters using HTML and Bluestreak Email system"
            ]
        }
    ];

    const education = [
        {
            institution: "North London University, London",
            degree: "MSC (Conversion) Computing",
            period: "September 1994 - August 1995"
        },
        {
            institution: "Institute of Latin American Studies (ILAS), London",
            degree: "MA Economics",
            period: "September 1993 - July 1994"
        },
        {
            institution: "Westminster University, London",
            degree: "Ba (Hons) Social Sciences",
            period: "September 1990 - July 1993"
        }
    ];

    const skills = [
        "JavaScript (ES6+)", "React.js", "TypeScript", "Redux/Redux Toolkit", "Zustand",
        "Node.js", "HTML5", "CSS3", "SASS", "Tailwind CSS", "React Router", "React Native",
        "Material UI", "Ant Design", "Fluent UI", "D3.js", "GSAP", "Jest", "Testing Library",
        "Git", "GitHub", "Unix", "ASP.NET", "SQL Server", "PHP", "Drupal", "Umbraco",
        "Sitecore", "jQuery", "Photoshop", "XCode", "Visual Studio", "TDD"
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div
                    ref={headerRef}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4"
                >
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="px-3 py-1 text-xs sm:text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors print:hidden"
                        >
                            🖨️ Print CV
                        </button>
                    </div>
                </div>

                <div ref={sectionsRef}>
                    {/* Personal Information */}
                    <div className="cv-section bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-blue-500">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-4">{personalInfo.name}</h1>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm sm:text-base text-gray-600">
                            <div className="flex items-center gap-2">
                                <span className="text-blue-500">📍</span>
                                <span>{personalInfo.address}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-blue-500">📞</span>
                                <span>{personalInfo.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-blue-500">📧</span>
                                <span>{personalInfo.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-blue-500">💼</span>
                                <span>25+ Years Experience</span>
                            </div>
                        </div>
                    </div>

                    {/* Profile */}
                    <div className="cv-section bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-blue-500">👤</span>
                            Profile
                        </h2>

                        {/* Profile Summary */}
                        <div className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line mb-4">
                            {profileSummary}
                        </div>

                        {/* Read More Button */}
                        <button
                            onClick={toggleProfile}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors mb-3 flex items-center gap-1"
                        >
                            {isProfileExpanded ? '🔽' : '▶️'}
                            {isProfileExpanded ? 'Show Less' : 'Read Full Profile'}
                        </button>

                        {/* Full Profile Content */}
                        {isProfileExpanded && (
                            <div id="profile-content" className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line border-t border-gray-200 pt-4">
                                {profile}
                            </div>
                        )}
                    </div>

                    {/* Skills */}
                    <div className="cv-section bg-white rounded-lg shadow-md p-6 mb-6" ref={skillsRef}>
                        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-blue-500">🛠️</span>
                            Technical Skills
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {skills.map((skill, index) => (
                                <span
                                    key={index}
                                    className="skill-item px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Work Experience */}
                    <div className="cv-section bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                            <span className="text-blue-500">💼</span>
                            Work Experience
                        </h2>
                        <div className="space-y-6">
                            {workExperience.map((job, index) => (
                                <div key={index} className="experience-item border-l-4 border-blue-200 pl-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                                        <h3 className="text-lg font-semibold text-gray-800">{job.company}</h3>
                                        <span className="text-sm text-gray-500">{job.period}</span>
                                    </div>
                                    <h4 className="text-base font-medium text-blue-600 mb-2">{job.position}</h4>
                                    <p className="text-sm sm:text-base text-gray-700 mb-3">{job.description}</p>

                                    {job.projects.length > 0 && (
                                        <div id={`section-projects-${index}`}>
                                            <button
                                                onClick={() => toggleSection(`projects-${index}`)}
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors mb-2 flex items-center gap-1"
                                            >
                                                {activeSection === `projects-${index}` ? '🔽' : '▶️'}
                                                Key Projects & Technologies
                                            </button>
                                            {activeSection === `projects-${index}` && (
                                                <div className="section-details">
                                                    <ul className="space-y-2 ml-4">
                                                        {job.projects.map((project, projectIndex) => (
                                                            <li key={projectIndex} className="text-sm text-gray-600">
                                                                <span className="text-blue-500">•</span> {project}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Education */}
                    <div className="cv-section bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-blue-500">🎓</span>
                            Education
                        </h2>
                        <div className="space-y-4">
                            {education.map((edu, index) => (
                                <div key={index} className="experience-item border-l-4 border-green-200 pl-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h3 className="text-base font-semibold text-gray-800">{edu.degree}</h3>
                                            <p className="text-sm text-gray-600">{edu.institution}</p>
                                        </div>
                                        <span className="text-sm text-gray-500">{edu.period}</span>
                                    </div>
                                </div>
                            ))}
                            <div className="experience-item border-l-4 border-green-200 pl-4">
                                <h3 className="text-base font-semibold text-gray-800">A-Levels & O-Levels</h3>
                                <p className="text-sm text-gray-600">Three A' Levels: Economics; Geography; Government and Politics</p>
                                <p className="text-sm text-gray-600">Five O 'Levels grade A-B including Math (B), English (B)</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-gray-500 mt-8 print:hidden">
                    <p>CV generated on {new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0.5in;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    body {
                        font-size: 12px;
                    }
                    .bg-gray-50 {
                        background-color: white !important;
                    }
                    .shadow-md {
                        box-shadow: none !important;
                    }
                    .rounded-lg {
                        border-radius: 0 !important;
                    }
                    .mb-6 {
                        margin-bottom: 1rem !important;
                    }
                    .p-6 {
                        padding: 1rem !important;
                    }
                }
            `}</style>
        </div>
    );
}

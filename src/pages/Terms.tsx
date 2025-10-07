import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useNavigate } from 'react-router-dom';

const Terms = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-2 max-w-sm mx-auto">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/')}
                        className="h-8 w-8 p-0"
                    >
                        <ArrowLeft className="h-6 w-6 text-foreground" />
                    </Button>
                    <img
                        src="/nk-logo.png"
                        alt="NK Club Logo"
                        className="h-8 w-8 object-contain"
                    />
                </div>

                <Button variant="outline" className="text-xs px-2 py-1 border-muted-foreground text-muted-foreground hover:bg-muted h-7">
                    Terms
                </Button>
            </header>

            {/* Main Content */}
            <main className="px-4 pt-6">
                <div className="max-w-sm mx-auto">
                    <Accordion type="single" collapsible className="space-y-2">
                        {/* Terms and Conditions */}
                        <AccordionItem value="terms" className="border rounded-lg px-4">
                            <AccordionTrigger className="text-left text-foreground font-medium">
                                Terms and Conditions
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-muted-foreground leading-relaxed space-y-4">
                                <p>
                                    These Terms and Conditions ("Terms") along with our Privacy Policy ("Privacy Policy") form a legally binding agreement ("Agreement") between you and us (APNACLUB.com). Please read these Terms and Privacy Policy carefully and let us know if you have any questions. We will do our best to answer your queries.
                                </p>

                                <div>
                                    <h4 className="font-semibold text-foreground mb-2">A. Users' Approval</h4>
                                    <p>Users approve of and accept this Agreement by:</p>
                                    <ul className="list-disc ml-4 mt-1">
                                        <li>Reading all terms and conditions.</li>
                                        <li>Reading all rules of this app.</li>
                                    </ul>
                                    <p className="mt-2">Users may accept this Agreement only if:</p>
                                    <ul className="list-disc ml-4 mt-1 space-y-1">
                                        <li>You are a natural person, at least 18 years old, and have the mental capacity to form a binding contract with us.</li>
                                        <li>You are not a resident of Tamil Nadu, Andhra Pradesh, Telangana, Assam, Orissa, Sikkim, or Nagaland.</li>
                                        <li>You are a juristic person, lawfully existing, and have all necessary authorizations to enter into this Agreement.</li>
                                        <li>You are not legally barred or restricted from using the app.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-foreground mb-2">B. Provision of the App</h4>
                                    <p>
                                        Under Section 12 of the Public Gambling Act, 1867, games of mere skill are exempt from the Act. Courts in India have determined that a game of skill is one where success depends mainly on the player's skill, not chance.
                                    </p>
                                    <p className="mt-2">
                                        The 'Ludo' game on our platform is classified as a Game of Skill under Indian law. We do not support or offer games of chance for money.
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-foreground mb-2">C. Game Rules</h4>
                                    <ul className="list-disc ml-4 space-y-1">
                                        <li>Record every game. If you suspect cheating, contact support with the recording.</li>
                                        <li>If the game has not started or you haven't made a move, show the recording to support.</li>
                                        <li>Without proof of cheating or errors, you will be considered to have lost.</li>
                                        <li>If no pawn is moved or no pawn is open at home, the game will be canceled.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-foreground mb-2">D. Deposit/Withdrawal</h4>
                                    <ul className="list-disc ml-4 space-y-1">
                                        <li>Deposit your balance in the Buy Chips section.</li>
                                        <li>Withdraw funds by setting a Sell Request in the app.</li>
                                        <li>Pending withdrawal requests will take 1-5 days to process.</li>
                                        <li>Incorrect payment details will not be refunded.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-foreground mb-2">E. Penalty for Wrong Updates</h4>
                                    <ul className="list-disc ml-4 space-y-1">
                                        <li>Games below ₹1000: 10% penalty.</li>
                                        <li>Games above ₹1000 and below ₹5000: ₹50 penalty.</li>
                                        <li>Games above ₹5000 and below ₹15000: ₹100 penalty.</li>
                                        <li>Failure to update the result after losing will incur a penalty of ₹25.</li>
                                    </ul>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* Privacy Policy */}
                        <AccordionItem value="privacy" className="border rounded-lg px-4">
                            <AccordionTrigger className="text-left text-foreground font-medium">
                                Privacy Policy
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-muted-foreground leading-relaxed space-y-4">
                                <div>
                                    <h4 className="font-semibold text-foreground mb-2">Introduction</h4>
                                    <p>
                                        This document explains how APNACLUB (https://APNACLUB.com) collects, processes, stores and/or shares any personal data and/or information from users. By accessing and/or using the Services you consent to the collection, transfer, manipulation, storage, disclosure and other uses of your information as described in this Privacy Policy.
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-foreground mb-2">Personal Data</h4>
                                    <p>While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You:</p>
                                    <ul className="list-disc ml-4 mt-1">
                                        <li>Email address</li>
                                        <li>First name and last name</li>
                                        <li>Phone Number</li>
                                        <li>Address, State, Province, ZIP/Postal code, City</li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-foreground mb-2">Cookies</h4>
                                    <p>
                                        APNACLUB uses cookies and other similar technologies to recognize you and your device, enable payment processes, provide customized services, and collect usage data.
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-foreground mb-2">Information Sharing</h4>
                                    <p>
                                        APNACLUB will only share your data with third parties as reasonably necessary to provide the Services, carry out your instructions, comply with legal obligations, or protect rights and property.
                                    </p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* About Us */}
                        <AccordionItem value="about" className="border rounded-lg px-4">
                            <AccordionTrigger className="text-left text-foreground font-medium">
                                About us
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-muted-foreground leading-relaxed space-y-4">
                                <p>
                                    APNACLUB ("or We") is a real-money online gaming product owned and operated by Allinone Hax. We are an HTML5 game-publishing company and our mission is to make accessing games fast and easy by removing the friction of app-installs.
                                </p>
                                <p>
                                    APNACLUB is a skill-based real-money gaming platform accessible only for our users in India. It is accessible on https://APNACLUB.com. On APNACLUB, users can compete for real cash in Tournaments and Battles.
                                </p>
                                <p>
                                    Welcome to APNACLUB, your ultimate destination for exciting online gaming experiences! We offer a diverse range of games including the classic Ludo and Snake and Ladder, with more thrilling options coming soon.
                                </p>
                                <p>
                                    At APNACLUB, we prioritize user satisfaction with a seamless interface and engaging gameplay. Whether you are here to relive your favorite childhood games or to discover new and exciting challenges, our platform provides a user-friendly environment that caters to all players.
                                </p>
                                <p>
                                    If you have any suggestions around new games that we should add or if you are a game developer yourself and want to work with us, don't hesitate to contact us on APNACLUB@gmail.com
                                </p>
                            </AccordionContent>
                        </AccordionItem>

                        {/* Contact Us */}
                        <AccordionItem value="contact" className="border rounded-lg px-4">
                            <AccordionTrigger className="text-left text-foreground font-medium">
                                Contact us
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-muted-foreground leading-relaxed space-y-2">
                                <p>For assistance, contact us at:</p>
                                <div className="space-y-1">
                                    <p><strong>Email:</strong> info@APNACLUB.com</p>
                                    <p><strong>Email:</strong> APNACLUB@gmail.com</p>
                                    <p><strong>Address:</strong> Jaipur, Rajasthan, 110059</p>
                                    <p><strong>Website:</strong> www.APNACLUB.com</p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </main>
        </div>
    );
};

export default Terms;


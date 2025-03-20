import React from "react";

const Footer = () => {
	return (
		<footer className="mt-8 text-center text-sm text-muted-foreground pb-8">
			<p className="text-xm">
				Made with ❤️ by{" "}
				<a href="https://github.com/abouabra">
					<span className="font-bold animate-gradient">Ayman Bouabra</span>
				</a>
			</p>
			<p>
				For more info check out the{" "}
				<a href="https://github.com/abouabra/DigitVision">
					<span className="font-bold animate-gradient">GitHub repository</span>
				</a>
			</p>
		</footer>
	);
};

export default Footer;

# Digit Vision
Interactive Neural Network Digit Recognition and Visualization

[![Video Title](https://i3.ytimg.com/vi/RiUD3UN9MNQ/maxresdefault.jpg)](https://www.youtube.com/watch?v=RiUD3UN9MNQ)

## 📝 Overview
Digit Vision is my interactive project that demonstrates how neural networks recognize handwritten digits. I built this to visualize the inner workings of convolutional neural networks and provide an educational tool for understanding machine learning concepts. Users can draw digits and see in real-time how each layer of the neural network processes the input, making complex AI concepts more accessible and intuitive.

## ✨ Key Features
- **Interactive Drawing Canvas**: Draw digits (0-9) and see instant predictions
- **Neural Network Visualization**: Explore activation maps from each convolutional layer
- **Confidence Metrics**: View prediction confidence levels for all possible digits
- **3D t-SNE Visualization**: Explore high-dimensional data in an interactive 3D space
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Real-time Processing**: Immediate feedback as you draw

## 🔧 Technical Stack
- **PyTorch**: Deep learning framework for training the CNN model
- **MNIST Dataset**: Training data of handwritten digits
- **Google Colab**: Environment for model training and development
- **Next.js**: React framework for server-rendered applications
- **React**: UI library for building component-based interfaces
- **Three.js**: 3D visualization of t-SNE dimensionality reduction
- **shadcn/ui**: Beautifully designed components built with Radix UI and Tailwind CSS
- **lucide-react**: Beautiful & consistent icon toolkit for React applications
- **onnxruntime**: For efficient neural network inference in the browser

## 💡 Implementation Details

### 🖌️ Interactive Drawing Interface
The project features an intuitive drawing canvas where users can:
- Draw any digit using mouse or touch input
- Clear the canvas to start over
- Receive immediate prediction feedback
- View confidence levels for each possible digit (0-9)

### 🧠 Neural Network Visualization
Digit Vision provides a unique look into how convolutional neural networks process images:
- Visualization of convolutional layers (conv1, conv1 act, conv1 pool)
- Display of filter responses for each channel
- Interactive grid showing different filters' responses to your drawing
- Detailed view of individual activation maps on selection

### 📊 3D Data Visualization
The project includes a sophisticated 3D visualization:
- t-SNE dimensionality reduction of high-dimensional MNIST data
- Interactive 3D environment to explore the data space
- Color-coded points representing different digits
- Rotation controls to view the data from different angles
- Option to stop/start rotation for easier exploration

## 🎓 My Learning Journey
Through building Digit Vision, I gained valuable insights into:
- Training and optimizing convolutional neural networks for image recognition
- Techniques for extracting and visualizing intermediate activations in deep learning models
- Methods for implementing interactive web-based machine learning applications
- Approaches to dimensionality reduction for visualizing high-dimensional data
- Strategies for creating intuitive user interfaces for complex technical concepts
- The importance of providing visual feedback in educational AI tools

This project has significantly deepened my understanding of both the technical aspects of deep learning and the challenges of making these complex systems more transparent and understandable to users.

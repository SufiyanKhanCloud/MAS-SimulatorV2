# 1. Define the Cloud Provider
provider "aws" {
  region = "us-east-1"
}

# 2. Get the latest free-tier eligible Ubuntu 22.04 Image
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical's official AWS account ID

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

# 3. Upload your public SSH key to AWS
resource "aws_key_pair" "deployer_key" {
  key_name   = "mas-simulator-key"
  public_key = file("~/.ssh/mas_simulator_key.pub")
}

# 4. Create a Security Group (Virtual Firewall)
resource "aws_security_group" "web_sg" {
  name        = "mas-simulator-sg"
  description = "Allow SSH and HTTP/Port 3000 traffic"

  # Allow SSH access so Ansible can configure it later
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] 
  }

  # Allow public access to port 3000 for your Next.js container
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow the server to access the internet (to pull your Docker image)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 5. Provision the actual EC2 Server
resource "aws_instance" "app_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t2.micro" # 100% Free Tier Eligible
  key_name      = aws_key_pair.deployer_key.key_name
  vpc_security_group_ids = [aws_security_group.web_sg.id]

  tags = {
    Name = "MAS-Simulator-Production"
  }
}

# 6. Output the Public IP so we know where to find the website
output "server_public_ip" {
  description = "The public IP address of the web server"
  value       = aws_instance.app_server.public_ip
}
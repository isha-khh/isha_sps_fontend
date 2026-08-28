using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using System.Data.OleDb;

public partial class admin_user_group_reg : ez.admin.PageBase
{

    ez.admin.item item = new ez.admin.item();
   
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
                         
           
            if (!isStrNull(Request["num"]))
            {
             
                group group = new group();           
                if (group.Load(Val(Request["num"])))
                {
                    mode.Value = "edit";
                    PlaceHolder1.Visible = false;
                    group.DataInfo info = group.Data;
                    g_name.Value = info.g_name;
                    g_name2.Text = info.g_name;
                    demo.Value = info.demo;
                    items.Value = "," + info.items;                   
                }
                else
                {
                    Response.Write(group.log);
                    ScriptMsg("查無資料", "group_show.aspx" + rtnQueryString("num"));
                }
                goBack.Visible = true;
                goBack.NavigateUrl = "group_show.aspx" + rtnQueryString("num");

            }
            else
            {
                mode.Value = "add";
            }

            BuildTreeView();            

        }
       
    }

    #region 產生TreeView選單

    public void BuildTreeView()
    {
        this.TreeView1.Nodes.Clear();
        BuildChild(0, this.TreeView1.Nodes,1);
    }

    public void BuildChild(int RootUid, TreeNodeCollection Nodes, int level)
    {

        bool isLastLevel = (level + 1 > item.maxLevel);

        DataTable dt = item.options(RootUid, (loginInfo.isLoginDesginMode ? null : loginInfo.Power));    

        for (int i = 0; i < dt.Rows.Count; i++)
        {

            TreeNode newNode = new TreeNode();
            newNode.Text = dt.Rows[i]["title"].ToString();
            newNode.Value = dt.Rows[i]["num"].ToString();
            newNode.ShowCheckBox = true;
            newNode.NavigateUrl = "javascript:void(0)";
            newNode.ToolTip = dt.Rows[i]["root"].ToString() + "-" + dt.Rows[i]["num"].ToString();
            if (!isStrNull(items.Value))
            {
                if (items.Value.IndexOf("," + newNode.Value + ",") > -1) { newNode.Checked = true; }
            }
            newNode.Expand();
            Nodes.Add(newNode);
            if (!isLastLevel)
            {
                BuildChild((int)dt.Rows[i]["num"], newNode.ChildNodes, level + 1);
            }
          

        }

      

    }

    #endregion
    

    
    #region 新增/修改資料

    protected void submitButton_Click(object sender, EventArgs e)
    {
        if (Page.IsValid)
        {
            msg.Text = "";

            group group = new group();
            group.DataInfo info = new group.DataInfo();

            for (int i = 0; i < TreeView1.CheckedNodes.Count; i++)
            {
                if (TreeView1.CheckedNodes[i].Checked)
                {
                    info.items += ValString(TreeView1.CheckedNodes[i].Value) + ",";            
                }
            }

            info.g_name = g_name.Value.Trim();
            info.demo = demo.Value.Trim();

            switch (mode.Value)
            {
                case "add":
                    group.Data = info;
                    if (group.Add()) { Response.Redirect("group_show.aspx"); }
                    else { msg.Text = group.log; }
                    break;
                case "edit":
                    info.num = Val(Request["num"]);
                    group.Data = info;
                    if (group.Edit()) { Response.Redirect("group_show.aspx" + rtnQueryString("num")); }
                    else { msg.Text = group.log; }
                    break;
                default:                   
                    break;
            }
            
        }
    }

    #endregion


}